from __future__ import annotations

from pathlib import Path

from app.config import Settings, get_settings
from app.schemas import AnalysisRecord


class AnalysisStore:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.records_dir = self.settings.analysis_storage_dir / "records"
        self.records_dir.mkdir(parents=True, exist_ok=True)
        self.latest_file = self.settings.analysis_storage_dir / "latest.txt"

    def save(self, record: AnalysisRecord) -> None:
        self.record_path(record.repo_id).write_text(
            record.model_dump_json(indent=2),
            encoding="utf-8",
        )
        self.latest_file.write_text(record.repo_id, encoding="utf-8")

    def load(self, repo_id: str | None = None) -> AnalysisRecord:
        record_id = repo_id or self._latest_repo_id()
        if record_id is None:
            raise FileNotFoundError("No analyzed repository found.")

        record_path = self.record_path(record_id)
        if not record_path.exists():
            raise FileNotFoundError(f"No saved analysis record found for '{record_id}'.")
        return AnalysisRecord.model_validate_json(record_path.read_text(encoding="utf-8"))

    def record_path(self, repo_id: str) -> Path:
        return self.records_dir / f"{repo_id}.json"

    def _latest_repo_id(self) -> str | None:
        if not self.latest_file.exists():
            return None
        value = self.latest_file.read_text(encoding="utf-8").strip()
        return value or None
