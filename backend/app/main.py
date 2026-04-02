from __future__ import annotations

from datetime import UTC, datetime

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.schemas import (
    AnalysisRecord,
    AskRequest,
    AskResponse,
    ChunkPreview,
    DiagramsResponse,
    DiagramData,
    HealthResponse,
    IndexRequest,
    IndexResponse,
    RepoLoadRequest,
    RepoLoadResponse,
    RepoMetadata,
    RepoSummaryResponse,
    SourceReference,
)


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="AI-powered repository understanding backend.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_active_record: AnalysisRecord | None = None


def _placeholder_summary(metadata: RepoMetadata) -> RepoSummaryResponse:
    return RepoSummaryResponse(
        repo_id=metadata.repo_id,
        repo_name=metadata.repo_name,
        repo_url=metadata.repo_url,
        detected_framework=metadata.detected_framework,
        loaded_at=metadata.loaded_at,
        file_count=metadata.file_count,
        indexed_file_count=metadata.indexed_file_count,
        total_classes=metadata.total_classes,
        total_functions=metadata.total_functions,
        top_level_folders=metadata.top_level_folders,
        important_files=metadata.important_files,
        entry_points=metadata.entry_points,
        major_modules=metadata.major_modules,
        languages=metadata.languages,
    )


def _require_record(repo_id: str | None = None) -> AnalysisRecord:
    if _active_record is None:
        raise HTTPException(status_code=404, detail="No repository has been analyzed yet.")
    if repo_id and _active_record.repo_id != repo_id:
        raise HTTPException(status_code=404, detail=f"Repository '{repo_id}' is not loaded.")
    return _active_record


@app.get("/health", response_model=HealthResponse)
def healthcheck() -> HealthResponse:
    return HealthResponse(app_name=settings.app_name, environment=settings.app_env)


@app.post("/analyze/repo-load", response_model=RepoLoadResponse)
def analyze_repo_load(payload: RepoLoadRequest) -> RepoLoadResponse:
    global _active_record

    loaded_at = datetime.now(UTC)
    metadata = RepoMetadata(
        repo_id="pending-analysis",
        repo_name="Repo pending",
        repo_url=payload.repo_url,
        local_path="",
        loaded_at=loaded_at,
        warnings=[
            "Phase 1 scaffold is active. Repository cloning and parsing will be wired in Phase 2."
        ],
    )
    summary = _placeholder_summary(metadata)
    diagrams = [
        DiagramData(
            id="project-structure",
            title="Project structure",
            description="Placeholder structure diagram until repository parsing is enabled.",
            mermaid="flowchart TD\n    A[Paste a repo URL] --> B[Parse repository]\n    B --> C[Render architecture]",
        ),
        DiagramData(
            id="dependencies",
            title="File dependencies",
            description="Placeholder dependency diagram until import analysis is enabled.",
            mermaid="flowchart LR\n    P[Python files] --> I[Import graph]\n    I --> D[Diagram]",
        ),
    ]
    _active_record = AnalysisRecord(
        repo_id=metadata.repo_id,
        repo_name=metadata.repo_name,
        repo_url=metadata.repo_url,
        metadata=metadata,
        summary=summary,
        diagrams=diagrams,
    )
    return RepoLoadResponse(metadata=metadata, summary=summary, diagrams=diagrams, warnings=metadata.warnings)


@app.get("/analyze/summary", response_model=RepoSummaryResponse)
def analyze_summary(repo_id: str | None = Query(default=None)) -> RepoSummaryResponse:
    return _require_record(repo_id).summary


@app.get("/analyze/diagrams", response_model=DiagramsResponse)
def analyze_diagrams(repo_id: str | None = Query(default=None)) -> DiagramsResponse:
    record = _require_record(repo_id)
    return DiagramsResponse(repo_id=record.repo_id, repo_name=record.repo_name, diagrams=record.diagrams)


@app.post("/analyze/index", response_model=IndexResponse)
def analyze_index(payload: IndexRequest) -> IndexResponse:
    record = _require_record(payload.repo_id)
    indexed_at = datetime.now(UTC)
    return IndexResponse(
        repo_id=record.repo_id,
        repo_name=record.repo_name,
        collection_name="reposketch-placeholder",
        indexed_files=0,
        indexed_chunks=0,
        status="placeholder",
        indexed_at=indexed_at,
    )


@app.post("/ask", response_model=AskResponse)
def ask_repo(payload: AskRequest) -> AskResponse:
    record = _require_record(payload.repo_id)
    answer = (
        "Phase 1 scaffold is active. Repo grounded Q&A will be enabled once indexing and retrieval are wired."
    )
    return AskResponse(
        repo_id=record.repo_id,
        repo_name=record.repo_name,
        answer=answer,
        sources=[SourceReference(file_path="README.md")],
        retrieved_chunks=[
            ChunkPreview(
                file_path="README.md",
                chunk_index=0,
                preview="RepoSketch will answer repository questions from indexed source files.",
            )
        ],
    )
