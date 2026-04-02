from __future__ import annotations

from typing import Any

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.config import Settings, get_settings
from app.prompts import QA_SYSTEM_PROMPT, QA_USER_PROMPT
from app.schemas import AnalysisRecord, AskResponse, ChunkPreview, SourceReference
from app.services.indexing_service import IndexingService


class QAService:
    def __init__(
        self,
        settings: Settings | None = None,
        indexing_service: IndexingService | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.indexing_service = indexing_service or IndexingService(self.settings)

    def ask(self, record: AnalysisRecord, question: str, top_k: int = 6) -> AskResponse:
        if not record.collection_name:
            raise ValueError("Repository has not been indexed yet. Run POST /analyze/index first.")

        vectorstore = self.indexing_service.get_vectorstore(record.repo_id)
        results = vectorstore.similarity_search_with_relevance_scores(question, k=top_k)
        if not results:
            return AskResponse(
                repo_id=record.repo_id,
                repo_name=record.repo_name,
                answer="The retriever did not find enough indexed repository context to answer that question.",
                sources=[],
                retrieved_chunks=[],
            )

        prompt = ChatPromptTemplate.from_messages(
            [("system", QA_SYSTEM_PROMPT), ("human", QA_USER_PROMPT)]
        )
        llm = ChatOpenAI(
            api_key=self.settings.openai_api_key,
            model=self.settings.chat_model,
            temperature=0,
        )
        context = self._format_context(results)
        response = llm.invoke(prompt.format_messages(question=question, context=context))

        chunk_previews = [
            ChunkPreview(
                file_path=document.metadata.get("file_path", "unknown"),
                chunk_index=int(document.metadata.get("chunk_index", 0)),
                preview=self._preview(document.page_content),
                symbol_names=self._symbol_names(document.metadata),
                score=float(score) if score is not None else None,
            )
            for document, score in results
        ]

        source_map: dict[str, set[str]] = {}
        for document, _score in results:
            file_path = document.metadata.get("file_path", "unknown")
            source_map.setdefault(file_path, set()).update(self._symbol_names(document.metadata))

        sources = [
            SourceReference(file_path=file_path, symbol_names=sorted(symbol_names))
            for file_path, symbol_names in source_map.items()
        ]

        return AskResponse(
            repo_id=record.repo_id,
            repo_name=record.repo_name,
            answer=self._response_text(response.content),
            sources=sorted(sources, key=lambda item: item.file_path),
            retrieved_chunks=chunk_previews,
        )

    @staticmethod
    def _format_context(results: list[tuple[Any, float]]) -> str:
        blocks: list[str] = []
        for index, (document, score) in enumerate(results, start=1):
            file_path = document.metadata.get("file_path", "unknown")
            symbol_names = document.metadata.get("symbol_names", "")
            block = [
                f"[Chunk {index}]",
                f"File: {file_path}",
                f"Symbols: {symbol_names or 'n/a'}",
                f"Score: {score:.4f}" if score is not None else "Score: n/a",
                "Content:",
                document.page_content,
            ]
            blocks.append("\n".join(block))
        return "\n\n".join(blocks)

    @staticmethod
    def _preview(content: str, limit: int = 280) -> str:
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

    @staticmethod
    def _response_text(content: Any) -> str:
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            fragments: list[str] = []
            for item in content:
                if isinstance(item, dict) and "text" in item:
                    fragments.append(str(item["text"]))
                else:
                    fragments.append(str(item))
            return "\n".join(fragment for fragment in fragments if fragment).strip()
        return str(content)
