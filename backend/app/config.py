from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, Field


BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")


class Settings(BaseModel):
    app_name: str = Field(default=os.getenv("APP_NAME", "RepoSketch"))
    app_env: str = Field(default=os.getenv("APP_ENV", "development"))
    app_host: str = Field(default=os.getenv("APP_HOST", "0.0.0.0"))
    app_port: int = Field(default=int(os.getenv("APP_PORT", "8000")))
    frontend_origin: str = Field(default=os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"))

    repo_storage_dir: Path = Field(
        default=Path(os.getenv("REPO_STORAGE_DIR", BACKEND_DIR / "storage" / "repos"))
    )
    analysis_storage_dir: Path = Field(
        default=Path(os.getenv("ANALYSIS_STORAGE_DIR", BACKEND_DIR / "storage" / "analysis"))
    )
    chroma_persist_dir: Path = Field(
        default=Path(os.getenv("CHROMA_PERSIST_DIR", BACKEND_DIR / "storage" / "chroma"))
    )

    max_file_size_kb: int = Field(default=int(os.getenv("MAX_FILE_SIZE_KB", "256")))
    allowed_code_extensions: tuple[str, ...] = Field(
        default=tuple(
            part.strip()
            for part in os.getenv(
                "ALLOWED_CODE_EXTENSIONS",
                ".py,.md,.txt,.json,.yaml,.yml,.toml,.ini,.cfg",
            ).split(",")
            if part.strip()
        )
    )
    indexable_extensions: tuple[str, ...] = Field(
        default=tuple(
            part.strip()
            for part in os.getenv(
                "INDEXABLE_EXTENSIONS",
                ".py,.md,.txt,.json,.yaml,.yml",
            ).split(",")
            if part.strip()
        )
    )
    openai_api_key: str | None = Field(default=os.getenv("OPENAI_API_KEY"))
    chat_model: str = Field(default=os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini"))
    embedding_model: str = Field(
        default=os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
    )
    chroma_collection_prefix: str = Field(
        default=os.getenv("CHROMA_COLLECTION_PREFIX", "reposketch")
    )

    def ensure_directories(self) -> None:
        self.repo_storage_dir.mkdir(parents=True, exist_ok=True)
        self.analysis_storage_dir.mkdir(parents=True, exist_ok=True)
        self.chroma_persist_dir.mkdir(parents=True, exist_ok=True)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    settings.ensure_directories()
    return settings
