from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

import chromadb
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

from app.config import Settings, get_settings
from app.schemas import RepoMetadata
from app.services.chunking_service import ChunkingService
from app.utils.path_utils import collection_name


@dataclass(slots=True)
class IndexingResult:
    collection_name: str
    indexed_files: int
    indexed_chunks: int
    indexed_at: datetime


class IndexingService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.chunking_service = ChunkingService(self.settings)
        self.client = chromadb.PersistentClient(path=str(self.settings.chroma_persist_dir))

    def index_repository(self, metadata: RepoMetadata, force_reindex: bool = True) -> IndexingResult:
        self._require_openai_key()

        documents = self.chunking_service.chunk_repository(metadata)
        if not documents:
            raise ValueError("No indexable repository files were found.")

        collection = collection_name(self.settings.chroma_collection_prefix, metadata.repo_id)
        if force_reindex:
            try:
                self.client.delete_collection(collection)
            except Exception:
                pass

        vectorstore = self.get_vectorstore(metadata.repo_id)
        vectorstore.add_documents(documents)
        if hasattr(vectorstore, "persist"):
            vectorstore.persist()

        indexed_files = len({document.metadata["file_path"] for document in documents})
        return IndexingResult(
            collection_name=collection,
            indexed_files=indexed_files,
            indexed_chunks=len(documents),
            indexed_at=datetime.now(UTC),
        )

    def get_vectorstore(self, repo_id: str) -> Chroma:
        self._require_openai_key()
        collection = collection_name(self.settings.chroma_collection_prefix, repo_id)
        return Chroma(
            client=self.client,
            collection_name=collection,
            embedding_function=OpenAIEmbeddings(
                api_key=self.settings.openai_api_key,
                model=self.settings.embedding_model,
            ),
            persist_directory=str(self.settings.chroma_persist_dir),
        )

    def _require_openai_key(self) -> None:
        if not self.settings.openai_api_key:
            raise ValueError(
                "OPENAI_API_KEY is missing. Add it to backend/.env before indexing or asking repository questions."
            )
