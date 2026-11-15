from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from app.config import Settings
from app.services.local_embeddings import LocalHashEmbeddings
from app.services.vector_store import ChunkRecord, VectorStore


class LocalEmbeddingTests(unittest.TestCase):
    def test_related_text_scores_higher_than_unrelated(self) -> None:
        model = LocalHashEmbeddings(768)
        query = model.embed_query("where is the CLI entry point defined")
        related = model.embed_query("def main(): Click CLI entry point for commands")
        unrelated = model.embed_query("database migration and SQL schema")
        related_score = sum(a * b for a, b in zip(query, related, strict=True))
        unrelated_score = sum(a * b for a, b in zip(query, unrelated, strict=True))
        self.assertGreater(related_score, unrelated_score)

    def test_vectors_are_normalized(self) -> None:
        vector = LocalHashEmbeddings(128).embed_query("repository parser and graph builder")
        norm = sum(value * value for value in vector) ** 0.5
        self.assertAlmostEqual(norm, 1.0, places=5)


class VectorStoreTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        settings = Settings(
            analysis_storage_dir=Path(self.temp_dir.name) / "analysis",
            repo_storage_dir=Path(self.temp_dir.name) / "repos",
            vector_store_dir=Path(self.temp_dir.name) / "vectors",
        )
        self.store = VectorStore(settings)
        self.model = LocalHashEmbeddings(768)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_replace_and_query(self) -> None:
        sources = [
            ("src/cli.py", "The CLI entry point is main(), which parses arguments."),
            ("db/schema.sql", "CREATE TABLE users with password hash and session fields."),
        ]
        chunks = [
            ChunkRecord(
                id=f"chunk-{index}",
                content=text,
                metadata={"file_path": path, "chunk_index": index},
                embedding=self.model.embed_query(text),
            )
            for index, (path, text) in enumerate(sources)
        ]
        info = self.store.replace_collection(
            "test_collection",
            provider="local-hash",
            model="local-hash-768",
            dimensions=768,
            chunks=chunks,
        )
        self.assertEqual(info.chunk_count, 2)

        results = self.store.query(
            "test_collection",
            self.model.embed_query("CLI entry point main"),
            top_k=2,
            query_text="CLI entry point main",
        )
        self.assertTrue(results)
        self.assertEqual(results[0][0]["metadata"]["file_path"], "src/cli.py")

    def test_delete_collection(self) -> None:
        self.store.replace_collection(
            "delete_me",
            provider="local-hash",
            model="local-hash-768",
            dimensions=768,
            chunks=[],
        )
        self.assertIsNotNone(self.store.get_collection("delete_me"))
        self.store.delete_collection("delete_me")
        self.assertIsNone(self.store.get_collection("delete_me"))


class ApiSmokeTests(unittest.TestCase):
    def test_health_and_history(self) -> None:
        from fastapi.testclient import TestClient

        from app.main import app

        client = TestClient(app)
        health = client.get("/health")
        self.assertEqual(health.status_code, 200)
        self.assertEqual(health.json()["status"], "ok")
        self.assertIn("ai_configured", health.json())

        root = client.get("/")
        self.assertEqual(root.status_code, 200)
        self.assertEqual(root.json()["name"], "RepoSketch")

        history = client.get("/analyze/repositories")
        self.assertEqual(history.status_code, 200)
        self.assertIn("repositories", history.json())


if __name__ == "__main__":
    unittest.main()
