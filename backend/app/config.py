from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, Field


BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_DIR.parent
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(PROJECT_ROOT / ".env")


def _resolve_path(raw_value: str | Path | None, default: Path) -> Path:
    if raw_value is None:
        return default.resolve()

    candidate = Path(raw_value)
    if candidate.is_absolute():
        return candidate
    return (PROJECT_ROOT / candidate).resolve()


def _split_csv(value: str) -> tuple[str, ...]:
    return tuple(part.strip() for part in value.split(",") if part.strip())


class Settings(BaseModel):
    app_name: str = Field(default=os.getenv("APP_NAME", "RepoSketch"))
    app_env: str = Field(default=os.getenv("APP_ENV", "development"))
    app_version: str = Field(default=os.getenv("APP_VERSION", "1.1.0"))
    app_host: str = Field(default=os.getenv("APP_HOST", "0.0.0.0"))
    app_port: int = Field(default=int(os.getenv("APP_PORT", "8000")))
    frontend_origin: str = Field(default=os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"))
    extra_frontend_origins: tuple[str, ...] = Field(
        default=_split_csv(os.getenv("EXTRA_FRONTEND_ORIGINS", ""))
    )

    repo_storage_dir: Path = Field(
        default=_resolve_path(os.getenv("REPO_STORAGE_DIR"), BACKEND_DIR / "storage" / "repos")
    )
    analysis_storage_dir: Path = Field(
        default=_resolve_path(
            os.getenv("ANALYSIS_STORAGE_DIR"), BACKEND_DIR / "storage" / "analysis"
        )
    )
    vector_store_dir: Path = Field(
        default=_resolve_path(
            os.getenv("VECTOR_STORE_DIR") or os.getenv("CHROMA_PERSIST_DIR"),
            BACKEND_DIR / "storage" / "vectors",
        )
    )

    max_file_size_kb: int = Field(default=int(os.getenv("MAX_FILE_SIZE_KB", "256")))
    max_repo_files: int = Field(default=int(os.getenv("MAX_REPO_FILES", "4000")))
    max_repo_size_mb: int = Field(default=int(os.getenv("MAX_REPO_SIZE_MB", "400")))
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
    index_excluded_directories: tuple[str, ...] = Field(
        default=tuple(
            part.strip().lower()
            for part in os.getenv(
                "INDEX_EXCLUDED_DIRECTORIES",
                ".git,.github,node_modules,dist,build,.venv,venv,__pycache__,docs,docs_src,tests,test,testing,examples,example,benchmarks,benchmark",
            ).split(",")
            if part.strip()
        )
    )
    index_excluded_files: tuple[str, ...] = Field(
        default=tuple(
            part.strip().lower()
            for part in os.getenv(
                "INDEX_EXCLUDED_FILES",
                "changes.md,changelog.md,changes.rst,license,license.txt,license.md,notice",
            ).split(",")
            if part.strip()
        )
    )
    max_index_chunks: int = Field(default=int(os.getenv("MAX_INDEX_CHUNKS", "1200")))
    embedding_batch_size: int = Field(
        default=max(1, min(100, int(os.getenv("EMBEDDING_BATCH_SIZE", "32"))))
    )
    index_embedding_provider: str = Field(
        default=os.getenv("INDEX_EMBEDDING_PROVIDER", "local").strip().lower()
    )

    gemini_api_key: str | None = Field(
        default=os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    )
    gemini_model: str = Field(
        default=os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    )
    gemini_embedding_model: str = Field(
        default=os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
    )
    gemini_embedding_dimensions: int = Field(
        default=int(os.getenv("GEMINI_EMBEDDING_DIMENSIONS", "768"))
    )
    gemini_timeout_seconds: float = Field(
        default=float(os.getenv("GEMINI_TIMEOUT_SECONDS", "90"))
    )
    gemini_max_retries: int = Field(default=int(os.getenv("GEMINI_MAX_RETRIES", "2")))
    vector_collection_prefix: str = Field(
        default=os.getenv("VECTOR_COLLECTION_PREFIX", "reposketch")
    )

    def ensure_directories(self) -> None:
        self.repo_storage_dir.mkdir(parents=True, exist_ok=True)
        self.analysis_storage_dir.mkdir(parents=True, exist_ok=True)
        self.vector_store_dir.mkdir(parents=True, exist_ok=True)

    @property
    def frontend_origins(self) -> list[str]:
        origins = [self.frontend_origin, *self.extra_frontend_origins]
        origins.extend(["http://localhost:5173", "http://127.0.0.1:5173"])
        return list(dict.fromkeys(origin.strip().rstrip("/") for origin in origins if origin.strip()))

    @property
    def ai_configured(self) -> bool:
        return bool(self.gemini_api_key)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    settings.ensure_directories()
    return settings
