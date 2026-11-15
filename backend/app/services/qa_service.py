from __future__ import annotations

from typing import Any

from app.config import Settings, get_settings
from app.prompts import QA_SYSTEM_PROMPT, QA_USER_PROMPT
from app.schemas import AnalysisRecord, AskResponse, ChunkPreview, SourceReference
from app.services.gemini_service import AIProviderError, GeminiService
from app.services.indexing_service import IndexingService, RetrievalResult


class QAService:
    def __init__(
        self,
        settings: Settings | None = None,
        indexing_service: IndexingService | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.indexing_service = indexing_service or IndexingService(self.settings)
        self.gemini = GeminiService(self.settings)

    def ask(self, record: AnalysisRecord, question: str, top_k: int = 6) -> AskResponse:
        if not record.collection_name:
            raise ValueError("Repository has not been indexed yet. Run POST /analyze/index first.")

        results, embedding_provider = self.indexing_service.retrieve(
            record.repo_id, question, top_k=top_k
        )
        if not results:
            return AskResponse(
                repo_id=record.repo_id,
                repo_name=record.repo_name,
                question=question,
                answer="The retriever did not find enough indexed repository context to answer that question.",
                sources=[],
                retrieved_chunks=[],
                provider=f"gemini:{embedding_provider}",
            )

        context = self._format_context(results)
        prompt = QA_USER_PROMPT.format(
            repo_name=record.repo_name,
            question=question,
            context=context,
        )
        try:
            answer = self.gemini.generate_text(
                prompt,
                system_instruction=QA_SYSTEM_PROMPT,
                temperature=0.15,
                max_output_tokens=1800,
            )
        except AIProviderError as exc:
            raise ValueError(str(exc)) from exc

        chunk_previews = [
            ChunkPreview(
                file_path=str(document.metadata.get("file_path", "unknown")),
                chunk_index=int(document.metadata.get("chunk_index", 0)),
                preview=self._preview(document.content),
                symbol_names=self._symbol_names(document.metadata),
                score=round(max(-1.0, min(1.0, document.score)), 4),
            )
            for document in results
        ]

        source_map: dict[str, set[str]] = {}
        for document in results:
            file_path = str(document.metadata.get("file_path", "unknown"))
            source_map.setdefault(file_path, set()).update(
                self._symbol_names(document.metadata)
            )

        sources = [
            SourceReference(file_path=file_path, symbol_names=sorted(symbol_names))
            for file_path, symbol_names in source_map.items()
        ]

        return AskResponse(
            repo_id=record.repo_id,
            repo_name=record.repo_name,
            question=question,
            answer=answer,
            sources=sorted(sources, key=lambda item: item.file_path),
            retrieved_chunks=chunk_previews,
            provider=f"gemini:{embedding_provider}",
        )

    @staticmethod
    def _format_context(results: list[RetrievalResult]) -> str:
        blocks: list[str] = []
        for index, document in enumerate(results, start=1):
            metadata = document.metadata
            file_path = metadata.get("file_path", "unknown")
            symbol_names = metadata.get("symbol_names", "")
            line_start = metadata.get("line_start", 0)
            line_end = metadata.get("line_end", 0)
            location = f"{file_path}:{line_start}-{line_end}" if line_start else str(file_path)
            block = [
                f"[Context {index}]",
                f"File: {location}",
                f"Symbols: {symbol_names or 'n/a'}",
                f"Relevance: {document.score:.4f}",
                "Content:",
                document.content,
            ]
            blocks.append("\n".join(block))
        return "\n\n".join(blocks)

    @staticmethod
    def _preview(content: str, limit: int = 320) -> str:
        normalized = " ".join(content.split())
        if len(normalized) <= limit:
            return normalized
        return normalized[: limit - 3].rstrip() + "..."

    @staticmethod
    def _symbol_names(metadata: dict[str, Any]) -> list[str]:
        raw = metadata.get("symbol_names", "")
        if not raw:
            return []
        return [item for item in str(raw).split(",") if item]
