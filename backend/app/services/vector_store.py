from __future__ import annotations

import json
import math
import sqlite3
from array import array
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.config import Settings, get_settings
from app.services.local_embeddings import TOKEN_PATTERN


@dataclass(slots=True)
class ChunkRecord:
    id: str
    content: str
    metadata: dict[str, Any]
    embedding: list[float]


@dataclass(slots=True)
class CollectionInfo:
    name: str
    provider: str
    model: str
    dimensions: int
    chunk_count: int
    updated_at: str


class VectorStore:
    """Tiny persistent cosine-similarity store backed by SQLite.

    Chroma + LangChain pulled hundreds of megabytes of dependencies into a free
    512 MB Render instance. This store keeps the same retrieval behaviour in a
    single SQLite file with float32 vectors.
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.path = self.settings.vector_store_dir / "vectors.sqlite3"
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=30)
        connection.execute("PRAGMA journal_mode=WAL")
        connection.execute("PRAGMA synchronous=NORMAL")
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize(self) -> None:
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS collections (
                    name TEXT PRIMARY KEY,
                    provider TEXT NOT NULL,
                    model TEXT NOT NULL,
                    dimensions INTEGER NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS chunks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    collection TEXT NOT NULL,
                    external_id TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    chunk_index INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    metadata TEXT NOT NULL,
                    embedding BLOB NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_chunks_collection
                    ON chunks(collection);
                """
            )

    def replace_collection(
        self,
        name: str,
        *,
        provider: str,
        model: str,
        dimensions: int,
        chunks: list[ChunkRecord],
    ) -> CollectionInfo:
        updated_at = datetime.now(UTC).isoformat()
        rows = []
        for chunk in chunks:
            if len(chunk.embedding) != dimensions:
                raise ValueError(
                    f"Embedding dimension mismatch: expected {dimensions}, got {len(chunk.embedding)}."
                )
            vector = array("f", chunk.embedding)
            rows.append(
                (
                    name,
                    chunk.id,
                    str(chunk.metadata.get("file_path", "unknown")),
                    int(chunk.metadata.get("chunk_index", 0)),
                    chunk.content,
                    json.dumps(chunk.metadata, ensure_ascii=False),
                    vector.tobytes(),
                )
            )

        with self._connect() as connection:
            connection.execute("DELETE FROM chunks WHERE collection = ?", (name,))
            connection.execute("DELETE FROM collections WHERE name = ?", (name,))
            connection.execute(
                "INSERT INTO collections(name, provider, model, dimensions, updated_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (name, provider, model, dimensions, updated_at),
            )
            if rows:
                connection.executemany(
                    "INSERT INTO chunks(collection, external_id, file_path, chunk_index, content, metadata, embedding) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?)",
                    rows,
                )

        return CollectionInfo(
            name=name,
            provider=provider,
            model=model,
            dimensions=dimensions,
            chunk_count=len(chunks),
            updated_at=updated_at,
        )

    def get_collection(self, name: str) -> CollectionInfo | None:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT name, provider, model, dimensions, updated_at FROM collections WHERE name = ?",
                (name,),
            ).fetchone()
            if row is None:
                return None
            count = connection.execute(
                "SELECT COUNT(*) AS count FROM chunks WHERE collection = ?", (name,)
            ).fetchone()["count"]
        return CollectionInfo(
            name=str(row["name"]),
            provider=str(row["provider"]),
            model=str(row["model"]),
            dimensions=int(row["dimensions"]),
            chunk_count=int(count),
            updated_at=str(row["updated_at"]),
        )

    def query(
        self,
        name: str,
        query_embedding: list[float],
        *,
        top_k: int = 6,
        query_text: str | None = None,
    ) -> list[tuple[dict[str, Any], float]]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT external_id, file_path, content, metadata, embedding FROM chunks WHERE collection = ?",
                (name,),
            ).fetchall()

        if not rows:
            return []

        query_norm = math.sqrt(sum(value * value for value in query_embedding)) or 1.0
        normalized_query = [value / query_norm for value in query_embedding]
        query_terms = {
            token
            for token in TOKEN_PATTERN.findall((query_text or "").lower())
            if len(token) > 1
        }
        scored: list[tuple[dict[str, Any], float]] = []

        for row in rows:
            vector = array("f")
            vector.frombytes(row["embedding"])
            if len(vector) != len(normalized_query):
                continue
            cosine = sum(a * b for a, b in zip(vector, normalized_query, strict=False))
            if query_terms:
                content_lower = row["content"].lower()
                path_lower = str(row["file_path"]).lower()
                content_hits = sum(1 for term in query_terms if term in content_lower)
                path_hits = sum(1 for term in query_terms if term in path_lower)
                lexical = content_hits / len(query_terms)
                path_bonus = path_hits / len(query_terms)
                score = (0.68 * cosine) + (0.24 * lexical) + (0.08 * path_bonus)
            else:
                score = cosine
            metadata = json.loads(row["metadata"])
            metadata["external_id"] = row["external_id"]
            scored.append(({"content": row["content"], "metadata": metadata}, float(score)))

        scored.sort(key=lambda item: item[1], reverse=True)
        return scored[: max(1, top_k)]

    def list_collections(self) -> list[CollectionInfo]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT name, provider, model, dimensions, updated_at FROM collections ORDER BY updated_at DESC"
            ).fetchall()
        return [
            CollectionInfo(
                name=str(row["name"]),
                provider=str(row["provider"]),
                model=str(row["model"]),
                dimensions=int(row["dimensions"]),
                chunk_count=0,
                updated_at=str(row["updated_at"]),
            )
            for row in rows
        ]

    def delete_collection(self, name: str) -> None:
        with self._connect() as connection:
            connection.execute("DELETE FROM chunks WHERE collection = ?", (name,))
            connection.execute("DELETE FROM collections WHERE name = ?", (name,))

    @property
    def size_bytes(self) -> int:
        try:
            return Path(self.path).stat().st_size
        except OSError:
            return 0
