from __future__ import annotations

import threading
from contextlib import contextmanager
from pathlib import Path

from app.config import Settings, get_settings
from app.schemas import AnalysisRecord


class AnalysisStore:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.records_dir = self.settings.analysis_storage_dir / "records"
        self.records_dir.mkdir(parents=True, exist_ok=True)
        self.latest_file = self.settings.analysis_storage_dir / "latest.txt"
        self._lock = threading.RLock()

    @contextmanager
    def lock(self):
        with self._lock:
            yield

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

    def list_records(self) -> list[AnalysisRecord]:
        records: list[AnalysisRecord] = []
        for path in self.records_dir.glob("*.json"):
            try:
                records.append(
                    AnalysisRecord.model_validate_json(path.read_text(encoding="utf-8"))
                )
            except Exception:
                continue
        return sorted(records, key=lambda record: record.metadata.loaded_at, reverse=True)

    def delete(self, repo_id: str) -> bool:
        path = self.record_path(repo_id)
        if not path.exists():
            return False
        path.unlink()
        if self.latest_file.exists():
            latest = self.latest_file.read_text(encoding="utf-8").strip()
            if latest == repo_id:
                remaining = self.list_records()
                if remaining:
                    self.latest_file.write_text(remaining[0].repo_id, encoding="utf-8")
                else:
                    self.latest_file.unlink(missing_ok=True)
        return True

    def record_path(self, repo_id: str) -> Path:
        return self.records_dir / f"{repo_id}.json"

    def _latest_repo_id(self) -> str | None:
        if not self.latest_file.exists():
            return None
        value = self.latest_file.read_text(encoding="utf-8").strip()
        return value or None
