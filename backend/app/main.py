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
from app.services.analysis_store import AnalysisStore
from app.services.diagram_service import DiagramService
from app.services.graph_builder import GraphBuilder
from app.services.indexing_service import IndexingService
from app.services.qa_service import QAService
from app.services.repo_loader import RepoLoader
from app.services.repo_parser import RepoParser, build_repo_summary


settings = get_settings()
analysis_store = AnalysisStore(settings)
repo_loader = RepoLoader(settings)
repo_parser = RepoParser(settings)
graph_builder = GraphBuilder()
diagram_service = DiagramService()
indexing_service = IndexingService(settings)
qa_service = QAService(settings, indexing_service)

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

def _require_record(repo_id: str | None = None) -> AnalysisRecord:
    try:
        return analysis_store.load(repo_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/health", response_model=HealthResponse)
def healthcheck() -> HealthResponse:
    return HealthResponse(app_name=settings.app_name, environment=settings.app_env)


@app.post("/analyze/repo-load", response_model=RepoLoadResponse)
def analyze_repo_load(payload: RepoLoadRequest) -> RepoLoadResponse:
    try:
        loaded_repo = repo_loader.clone_repository(payload.repo_url)
        metadata = repo_parser.parse_repository(loaded_repo)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    summary = build_repo_summary(metadata)
    graph_bundle = graph_builder.build(metadata)
    diagrams = diagram_service.build_diagrams(metadata, graph_bundle)
    record = AnalysisRecord(
        repo_id=metadata.repo_id,
        repo_name=metadata.repo_name,
        repo_url=metadata.repo_url,
        metadata=metadata,
        summary=summary,
        diagrams=diagrams,
    )
    analysis_store.save(record)
    return RepoLoadResponse(
        metadata=metadata,
        summary=summary,
        diagrams=diagrams,
        warnings=metadata.warnings,
    )


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
    try:
        result = indexing_service.index_repository(
            record.metadata,
            force_reindex=payload.force_reindex,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    updated_record = record.model_copy(
        update={
            "metadata": record.metadata.model_copy(
                update={"indexed_file_count": result.indexed_files}
            ),
            "summary": record.summary.model_copy(
                update={"indexed_file_count": result.indexed_files}
            ),
            "collection_name": result.collection_name,
            "indexed_at": result.indexed_at,
            "indexed_files": result.indexed_files,
            "indexed_chunks": result.indexed_chunks,
        }
    )
    analysis_store.save(updated_record)
    return IndexResponse(
        repo_id=record.repo_id,
        repo_name=record.repo_name,
        collection_name=result.collection_name,
        indexed_files=result.indexed_files,
        indexed_chunks=result.indexed_chunks,
        status="indexed",
        indexed_at=result.indexed_at,
    )


@app.post("/ask", response_model=AskResponse)
def ask_repo(payload: AskRequest) -> AskResponse:
    record = _require_record(payload.repo_id)
    try:
        return qa_service.ask(record, payload.question, payload.top_k)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
