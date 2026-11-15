from __future__ import annotations

import shutil
import time
from datetime import datetime

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.config import get_settings
from app.schemas import (
    AnalysisRecord,
    AskRequest,
    AskResponse,
    DeleteResponse,
    DiagramsResponse,
    HealthResponse,
    IndexRequest,
    IndexResponse,
    InsightsRequest,
    InsightsResponse,
    RepoHistoryItem,
    RepoHistoryResponse,
    RepoLoadRequest,
    RepoLoadResponse,
    RepoMetadataPublic,
    RepoSummaryResponse,
)
from app.services.analysis_store import AnalysisStore
from app.services.diagram_service import DiagramService
from app.services.graph_builder import GraphBuilder
from app.services.indexing_service import IndexingService
from app.services.insights_service import InsightsService
from app.services.qa_service import QAService
from app.services.repo_loader import RepoLoader
from app.services.repo_parser import RepoParser, build_repo_summary


settings = get_settings()
STARTED_AT = time.time()
analysis_store = AnalysisStore(settings)
repo_loader = RepoLoader(settings)
repo_parser = RepoParser(settings)
graph_builder = GraphBuilder()
diagram_service = DiagramService()
indexing_service = IndexingService(settings)
qa_service = QAService(settings, indexing_service)
insights_service = InsightsService(settings)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered repository understanding backend powered by the free Gemini API.",
    docs_url="/docs",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time-Ms"],
)
app.add_middleware(GZipMiddleware, minimum_size=1200)


@app.middleware("http")
async def add_process_headers(request: Request, call_next):
    started = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Process-Time-Ms"] = f"{(time.perf_counter() - started) * 1000:.1f}"
    response.headers["X-RepoSketch-Version"] = settings.app_version
    return response


def _require_record(repo_id: str | None = None) -> AnalysisRecord:
    try:
        return analysis_store.load(repo_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/")
def root() -> dict[str, str]:
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", response_model=HealthResponse)
def healthcheck() -> HealthResponse:
    return HealthResponse(
        app_name=settings.app_name,
        environment=settings.app_env,
        version=settings.app_version,
        ai_configured=settings.ai_configured,
        ai_model=settings.gemini_model,
        embedding_model=settings.gemini_embedding_model,
        embedding_provider=settings.index_embedding_provider,
        vector_store=f"sqlite:{settings.vector_store_dir.name}",
        uptime_seconds=int(time.time() - STARTED_AT),
    )


@app.get("/analyze/repositories", response_model=RepoHistoryResponse)
def list_repositories() -> RepoHistoryResponse:
    items: list[RepoHistoryItem] = []
    for record in analysis_store.list_records():
        collection = indexing_service.collection_info(record.repo_id)
        items.append(
            RepoHistoryItem(
                repo_id=record.repo_id,
                repo_name=record.repo_name,
                repo_url=record.repo_url,
                loaded_at=record.metadata.loaded_at,
                detected_framework=record.metadata.detected_framework,
                file_count=record.metadata.file_count,
                indexed_file_count=record.indexed_files or record.metadata.indexed_file_count,
                indexed_chunks=collection.chunk_count if collection else record.indexed_chunks or 0,
                has_insights=record.insights is not None,
                embedding_provider=collection.provider if collection else record.embedding_provider,
            )
        )
    return RepoHistoryResponse(repositories=items)


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
    with analysis_store.lock():
        analysis_store.save(record)
    return RepoLoadResponse(
        metadata=RepoMetadataPublic(
            repo_id=metadata.repo_id,
            repo_name=metadata.repo_name,
            repo_url=metadata.repo_url,
            loaded_at=metadata.loaded_at,
            detected_framework=metadata.detected_framework,
            file_count=metadata.file_count,
            indexed_file_count=metadata.indexed_file_count,
            total_classes=metadata.total_classes,
            total_functions=metadata.total_functions,
            warnings=metadata.warnings,
        ),
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
    return DiagramsResponse(
        repo_id=record.repo_id, repo_name=record.repo_name, diagrams=record.diagrams
    )


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
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {exc}") from exc

    with analysis_store.lock():
        latest = _require_record(record.repo_id)
        updated_record = latest.model_copy(
            update={
                "metadata": latest.metadata.model_copy(
                    update={"indexed_file_count": result.indexed_files}
                ),
                "summary": latest.summary.model_copy(
                    update={"indexed_file_count": result.indexed_files}
                ),
                "collection_name": result.collection_name,
                "indexed_at": result.indexed_at,
                "indexed_files": result.indexed_files,
                "indexed_chunks": result.indexed_chunks,
                "embedding_provider": result.embedding_provider,
                "embedding_model": result.embedding_model,
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
        embedding_provider=result.embedding_provider,
        embedding_model=result.embedding_model,
        warnings=result.warnings,
    )


@app.post("/analyze/insights", response_model=InsightsResponse)
def analyze_insights(payload: InsightsRequest) -> InsightsResponse:
    record = _require_record(payload.repo_id)
    if record.insights is not None and not payload.force_regenerate:
        return InsightsResponse(
            repo_id=record.repo_id, repo_name=record.repo_name, insights=record.insights
        )

    try:
        generated = insights_service.generate(record)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    with analysis_store.lock():
        latest = _require_record(record.repo_id)
        updated_record = latest.model_copy(update={"insights": generated})
        analysis_store.save(updated_record)
    return InsightsResponse(
        repo_id=record.repo_id,
        repo_name=record.repo_name,
        insights=generated,
    )


@app.get("/analyze/insights", response_model=InsightsResponse)
def get_insights(repo_id: str | None = Query(default=None)) -> InsightsResponse:
    record = _require_record(repo_id)
    return InsightsResponse(
        repo_id=record.repo_id,
        repo_name=record.repo_name,
        insights=record.insights,
    )


@app.post("/ask", response_model=AskResponse)
def ask_repo(payload: AskRequest) -> AskResponse:
    record = _require_record(payload.repo_id)
    try:
        return qa_service.ask(record, payload.question, payload.top_k)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Question answering failed: {exc}") from exc


@app.delete("/analyze/repository/{repo_id}", response_model=DeleteResponse)
def delete_repository(repo_id: str) -> DeleteResponse:
    with analysis_store.lock():
        record = _require_record(repo_id)
        indexing_service.delete_collection(record.repo_id)
        analysis_store.delete(record.repo_id)
        clone_path = settings.repo_storage_dir / record.repo_id
        if clone_path.exists():
            shutil.rmtree(clone_path, ignore_errors=True)
    return DeleteResponse(repo_id=record.repo_id)
