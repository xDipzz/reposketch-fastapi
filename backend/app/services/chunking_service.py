from __future__ import annotations

from pathlib import Path

from langchain_core.documents import Document

from app.config import Settings, get_settings
from app.schemas import FileAnalysis, RepoMetadata
from app.utils.file_utils import read_text_file


class ChunkingService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.excluded_directories = {
            item.lower() for item in self.settings.index_excluded_directories if item.strip()
        }

    def chunk_repository(self, metadata: RepoMetadata) -> list[Document]:
        repo_root = Path(metadata.local_path)
        documents: list[Document] = []

        for file in sorted(metadata.files, key=self._index_priority):
            if self._should_skip_indexing(file):
                continue

            file_path = repo_root / file.path
            if not file_path.exists():
                continue

            content = read_text_file(file_path)
            if not content.strip():
                continue

            if file.extension == ".py":
                next_documents = self._chunk_python_file(metadata, file, content)
            else:
                next_documents = self._chunk_text_file(metadata, file, content)

            if not next_documents:
                continue

            remaining = self.settings.max_index_chunks - len(documents)
            if remaining <= 0:
                break

            if len(next_documents) > remaining:
                documents.extend(next_documents[:remaining])
                break

            documents.extend(next_documents)

        return documents

    def _should_skip_indexing(self, file: FileAnalysis) -> bool:
        if file.extension not in self.settings.indexable_extensions:
            return True

        path = Path(file.path)
        parent_directories = (part.lower() for part in path.parts[:-1])
        return any(part in self.excluded_directories for part in parent_directories)

    def _index_priority(self, file: FileAnalysis) -> tuple[int, int, int, int, str]:
        path = Path(file.path)
        is_python = file.extension == ".py"
        is_root_level = len(path.parts) == 1
        top_level_folder = path.parts[0].lower() if len(path.parts) > 1 else ""
        is_source_package = is_python and top_level_folder not in self.excluded_directories

        return (
            0 if is_source_package else 1,
            0 if file.is_entry_point else 1,
            0 if file.is_important else 1,
            0 if is_root_level else 1,
            file.path,
        )

    def _chunk_python_file(
        self, metadata: RepoMetadata, file: FileAnalysis, content: str
    ) -> list[Document]:
        lines = content.splitlines()
        symbol_chunks: list[tuple[str, list[str], int | None, int | None]] = []
        symbols = sorted(
            [*file.classes, *file.functions],
            key=lambda symbol: (symbol.line_start or 0, symbol.name),
        )

        if not symbols:
            return self._build_documents_for_file(
                metadata=metadata,
                file=file,
                chunks=[(chunk, [], None, None) for chunk in self._split_text(content)],
            )

        first_symbol_line = min(symbol.line_start or 1 for symbol in symbols)
        header_text = "\n".join(lines[: max(0, min(first_symbol_line - 1, 80))]).strip()
        if header_text:
            symbol_chunks.append((header_text, ["module_header"], 1, first_symbol_line - 1))

        for symbol in symbols:
            if symbol.line_start is None or symbol.line_end is None:
                continue
            snippet = "\n".join(lines[symbol.line_start - 1 : symbol.line_end]).strip()
            if not snippet:
                continue
            for partial in self._split_text(snippet, max_chars=1800, overlap=160):
                symbol_chunks.append((partial, [symbol.name], symbol.line_start, symbol.line_end))

        last_symbol_end = max(symbol.line_end or 0 for symbol in symbols)
        tail_text = "\n".join(lines[last_symbol_end:]).strip()
        if tail_text:
            symbol_chunks.append((tail_text, ["module_tail"], last_symbol_end + 1, len(lines)))

        return self._build_documents_for_file(metadata=metadata, file=file, chunks=symbol_chunks)

    def _chunk_text_file(
        self, metadata: RepoMetadata, file: FileAnalysis, content: str
    ) -> list[Document]:
        chunks = [(chunk, [], None, None) for chunk in self._split_text(content)]
        return self._build_documents_for_file(metadata=metadata, file=file, chunks=chunks)

    def _build_documents_for_file(
        self,
        metadata: RepoMetadata,
        file: FileAnalysis,
        chunks: list[tuple[str, list[str], int | None, int | None]],
    ) -> list[Document]:
        documents: list[Document] = []
        for chunk_index, (chunk_text, symbol_names, line_start, line_end) in enumerate(chunks):
            cleaned = chunk_text.strip()
            if not cleaned:
                continue
            documents.append(
                Document(
                    page_content=cleaned,
                    metadata={
                        "repo_id": metadata.repo_id,
                        "repository_name": metadata.repo_name,
                        "file_path": file.path,
                        "file_type": file.extension,
                        "symbol_names": ",".join(symbol_names),
                        "chunk_index": chunk_index,
                        "line_start": line_start or 0,
                        "line_end": line_end or 0,
                    },
                )
            )
        return documents

    @staticmethod
    def _split_text(text: str, max_chars: int = 1400, overlap: int = 180) -> list[str]:
        stripped = text.strip()
        if not stripped:
            return []
        if len(stripped) <= max_chars:
            return [stripped]

        chunks: list[str] = []
        start = 0
        text_length = len(stripped)

        while start < text_length:
            end = min(text_length, start + max_chars)
            if end < text_length:
                boundary = stripped.rfind("\n", start + max_chars // 2, end)
                if boundary != -1 and boundary > start:
                    end = boundary

            chunk = stripped[start:end].strip()
            if chunk:
                chunks.append(chunk)

            if end >= text_length:
                break
            start = max(end - overlap, start + 1)

        return chunks
