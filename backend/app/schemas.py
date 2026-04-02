from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    app_name: str
    environment: str


class RepoLoadRequest(BaseModel):
    repo_url: str = Field(..., examples=["https://github.com/tiangolo/fastapi"])


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
    metadata: RepoMetadata
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


class AskRequest(BaseModel):
    question: str
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
    answer: str
    sources: list[SourceReference] = Field(default_factory=list)
    retrieved_chunks: list[ChunkPreview] = Field(default_factory=list)


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
