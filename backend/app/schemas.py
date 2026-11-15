from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    app_name: str
    environment: str
    version: str = "1.1.0"
    ai_configured: bool = False
    ai_model: str = ""
    embedding_model: str = ""
    embedding_provider: str = "local"
    vector_store: str = "sqlite"
    uptime_seconds: int = 0


class RepoLoadRequest(BaseModel):
    repo_url: str = Field(
        ...,
        min_length=8,
        max_length=500,
        examples=["https://github.com/tiangolo/fastapi"],
    )


class ImportStatement(BaseModel):
    module: str | None = None
    names: list[str] = Field(default_factory=list)
    level: int = 0


class SymbolReference(BaseModel):
    name: str
    kind: str
    line_start: int | None = None
    line_end: int | None = None


class FileAnalysis(BaseModel):
    path: str
    extension: str
    language: str
    size_bytes: int
    module_name: str | None = None
    classes: list[SymbolReference] = Field(default_factory=list)
    functions: list[SymbolReference] = Field(default_factory=list)
    imports: list[ImportStatement] = Field(default_factory=list)
    is_entry_point: bool = False
    is_important: bool = False


class ImportEdge(BaseModel):
    source: str
    target: str
    module: str


class RepoMetadata(BaseModel):
    repo_id: str
    repo_name: str
    repo_url: str
    local_path: str
    loaded_at: datetime
    top_level_folders: list[str] = Field(default_factory=list)
    important_files: list[str] = Field(default_factory=list)
    entry_points: list[str] = Field(default_factory=list)
    major_modules: list[str] = Field(default_factory=list)
    detected_framework: str | None = None
    file_count: int = 0
    indexed_file_count: int = 0
    total_classes: int = 0
    total_functions: int = 0
    languages: dict[str, int] = Field(default_factory=dict)
    files: list[FileAnalysis] = Field(default_factory=list)
    import_edges: list[ImportEdge] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class RepoMetadataPublic(BaseModel):
    """Compact metadata returned to browsers; the full record stays server-side."""

    repo_id: str
    repo_name: str
    repo_url: str
    loaded_at: datetime
    detected_framework: str | None = None
    file_count: int = 0
    indexed_file_count: int = 0
    total_classes: int = 0
    total_functions: int = 0
    warnings: list[str] = Field(default_factory=list)


class RepoSummaryResponse(BaseModel):
    repo_id: str
    repo_name: str
    repo_url: str
    detected_framework: str | None = None
    loaded_at: datetime
    file_count: int
    indexed_file_count: int
    total_classes: int
    total_functions: int
    top_level_folders: list[str] = Field(default_factory=list)
    important_files: list[str] = Field(default_factory=list)
    entry_points: list[str] = Field(default_factory=list)
    major_modules: list[str] = Field(default_factory=list)
    languages: dict[str, int] = Field(default_factory=dict)


class DiagramData(BaseModel):
    id: str
    title: str
    description: str
    mermaid: str


class RepoLoadResponse(BaseModel):
    metadata: RepoMetadataPublic
    summary: RepoSummaryResponse
    diagrams: list[DiagramData] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class DiagramsResponse(BaseModel):
    repo_id: str
    repo_name: str
    diagrams: list[DiagramData] = Field(default_factory=list)


class IndexRequest(BaseModel):
    repo_id: str | None = None
    force_reindex: bool = True


class IndexResponse(BaseModel):
    repo_id: str
    repo_name: str
    collection_name: str
    indexed_files: int
    indexed_chunks: int
    status: str
    indexed_at: datetime
    embedding_provider: str = "gemini"
    embedding_model: str = ""
    warnings: list[str] = Field(default_factory=list)


class AskRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=2000)
    repo_id: str | None = None
    top_k: int = Field(default=6, ge=1, le=12)


class SourceReference(BaseModel):
    file_path: str
    symbol_names: list[str] = Field(default_factory=list)


class ChunkPreview(BaseModel):
    file_path: str
    chunk_index: int
    preview: str
    symbol_names: list[str] = Field(default_factory=list)
    score: float | None = None


class AskResponse(BaseModel):
    repo_id: str
    repo_name: str
    question: str = ""
    answer: str
    sources: list[SourceReference] = Field(default_factory=list)
    retrieved_chunks: list[ChunkPreview] = Field(default_factory=list)
    provider: str = "gemini"


class RepoInsights(BaseModel):
    overview: str = ""
    architecture: str = ""
    onboarding: str = ""
    entry_points: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    suggested_questions: list[str] = Field(default_factory=list)
    generated_at: datetime | None = None
    model: str = ""


class InsightsRequest(BaseModel):
    repo_id: str | None = None
    force_regenerate: bool = False


class InsightsResponse(BaseModel):
    repo_id: str
    repo_name: str
    insights: RepoInsights | None = None


class RepoHistoryItem(BaseModel):
    repo_id: str
    repo_name: str
    repo_url: str
    loaded_at: datetime
    detected_framework: str | None = None
    file_count: int = 0
    indexed_file_count: int = 0
    indexed_chunks: int = 0
    has_insights: bool = False
    embedding_provider: str | None = None


class RepoHistoryResponse(BaseModel):
    repositories: list[RepoHistoryItem] = Field(default_factory=list)


class DeleteResponse(BaseModel):
    status: str = "deleted"
    repo_id: str


class UsageAction(BaseModel):
    action: str
    label: str
    cost: int


class UsageResponse(BaseModel):
    limit: int = 100
    used: int = 0
    remaining: int = 100
    reset_at: datetime
    costs: list[UsageAction] = Field(default_factory=list)


class AnalysisRecord(BaseModel):
    repo_id: str
    repo_name: str
    repo_url: str
    metadata: RepoMetadata
    summary: RepoSummaryResponse
    diagrams: list[DiagramData] = Field(default_factory=list)
    collection_name: str | None = None
    indexed_at: datetime | None = None
    indexed_files: int | None = None
    indexed_chunks: int | None = None
    embedding_provider: str | None = None
    embedding_model: str | None = None
    insights: RepoInsights | None = None
