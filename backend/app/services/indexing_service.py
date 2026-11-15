from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from app.config import Settings, get_settings
from app.schemas import RepoMetadata
from app.services.chunking_service import ChunkingService
from app.services.gemini_service import AIProviderError, GeminiService
from app.services.local_embeddings import LocalHashEmbeddings
from app.services.vector_store import ChunkRecord, VectorStore
from app.utils.path_utils import collection_name


@dataclass(slots=True)
class IndexingResult:
    collection_name: str
    indexed_files: int
    indexed_chunks: int
    indexed_at: datetime
    embedding_provider: str
    embedding_model: str
    warnings: list[str] = field(default_factory=list)


@dataclass(slots=True)
class RetrievalResult:
    content: str
    metadata: dict[str, Any]
    score: float


class IndexingService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.chunking_service = ChunkingService(self.settings)
        self.gemini = GeminiService(self.settings)
        self.store = VectorStore(self.settings)
        self.local_embeddings = LocalHashEmbeddings(self.settings.gemini_embedding_dimensions)

    def index_repository(self, metadata: RepoMetadata, force_reindex: bool = True) -> IndexingResult:
        collection = collection_name(self.settings.vector_collection_prefix, metadata.repo_id)
        existing = self.store.get_collection(collection)
        if existing and not force_reindex:
            return IndexingResult(
                collection_name=collection,
                indexed_files=metadata.indexed_file_count,
                indexed_chunks=existing.chunk_count,
                indexed_at=datetime.fromisoformat(existing.updated_at),
                embedding_provider=existing.provider,
                embedding_model=existing.model,
                warnings=["Existing index reused."],
            )

        documents = self.chunking_service.chunk_repository(metadata)
        if not documents:
            raise ValueError("No indexable repository files were found.")

        contents = [document.content for document in documents]
        warnings: list[str] = []
        provider = "local-hash"
        model = f"local-hash-{self.settings.gemini_embedding_dimensions}"

        if self.settings.index_embedding_provider == "gemini":
            provider = "gemini"
            model = self.settings.gemini_embedding_model
            try:
                vectors = self.gemini.embed_texts(contents, task_type="RETRIEVAL_DOCUMENT")
            except AIProviderError as exc:
                warnings.append(
                    "Gemini embeddings were unavailable, so RepoSketch fell back to a local "
                    f"offline embedding model. Reason: {exc}"
                )
                provider = "local-hash"
                model = f"local-hash-{self.settings.gemini_embedding_dimensions}"
                vectors = self.local_embeddings.embed_documents(contents)
        else:
            vectors = self.local_embeddings.embed_documents(contents)
            warnings.append(
                "Indexed with the local offline embedding model; Gemini is used for the "
                "briefing and grounded answers."
            )

        chunks = [
            ChunkRecord(
                id=f"{metadata.repo_id}:{document.metadata.get('file_path')}:"
                f"{document.metadata.get('chunk_index')}:{index}",
                content=document.content,
                metadata=dict(document.metadata),
                embedding=vector,
            )
            for index, (document, vector) in enumerate(zip(documents, vectors, strict=True))
        ]

        info = self.store.replace_collection(
            collection,
            provider=provider,
            model=model,
            dimensions=self.settings.gemini_embedding_dimensions,
            chunks=chunks,
        )
        indexed_files = len({document.metadata["file_path"] for document in documents})

        return IndexingResult(
            collection_name=collection,
            indexed_files=indexed_files,
            indexed_chunks=len(documents),
            indexed_at=datetime.fromisoformat(info.updated_at),
            embedding_provider=provider,
            embedding_model=model,
            warnings=warnings,
        )

    def retrieve(self, repo_id: str, question: str, top_k: int = 6) -> tuple[list[RetrievalResult], str]:
        collection = collection_name(self.settings.vector_collection_prefix, repo_id)
        info = self.store.get_collection(collection)
        if info is None:
            raise ValueError(
                "Repository has not been indexed yet. Run POST /analyze/index first."
            )

        if info.provider == "local-hash":
            query_vector = self.local_embeddings.embed_query(question)
        else:
            try:
                query_vector = self.gemini.embed_query(question)
            except AIProviderError as exc:
                raise ValueError(
                    "Gemini query embeddings are unavailable right now. "
                    f"Re-index the repository to use the offline fallback, or retry later. ({exc})"
                ) from exc

        results = self.store.query(collection, query_vector, top_k=top_k, query_text=question)
        return (
            [
                RetrievalResult(
                    content=item["content"],
                    metadata=item["metadata"],
                    score=score,
                )
                for item, score in results
            ],
            info.provider,
        )

    def collection_info(self, repo_id: str):
        collection = collection_name(self.settings.vector_collection_prefix, repo_id)
        return self.store.get_collection(collection)

    def delete_collection(self, repo_id: str) -> None:
        collection = collection_name(self.settings.vector_collection_prefix, repo_id)
        self.store.delete_collection(collection)
