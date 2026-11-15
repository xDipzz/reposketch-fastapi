from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.config import Settings, get_settings
from app.prompts import INSIGHTS_SYSTEM_PROMPT, INSIGHTS_USER_PROMPT
from app.schemas import AnalysisRecord, RepoInsights
from app.services.gemini_service import AIProviderError, GeminiService


class InsightsService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.gemini = GeminiService(self.settings)

    def generate(self, record: AnalysisRecord) -> RepoInsights:
        metadata = record.metadata
        languages = ", ".join(
            f"{language} ({count})" for language, count in metadata.languages.items()
        ) or "unknown"
        files = "\n".join(f"- {path}" for path in metadata.files[:80])
        important = ", ".join(metadata.important_files[:20]) or "none detected"
        entry_points = ", ".join(metadata.entry_points[:20]) or "none detected"
        modules = ", ".join(metadata.major_modules[:20]) or "none detected"

        prompt = INSIGHTS_USER_PROMPT.format(
            repo_name=metadata.repo_name,
            repo_url=metadata.repo_url,
            framework=metadata.detected_framework or "not detected",
            file_count=metadata.file_count,
            classes=metadata.total_classes,
            functions=metadata.total_functions,
            languages=languages,
            important_files=important,
            entry_points=entry_points,
            major_modules=modules,
            file_sample=files,
        )

        try:
            payload = self.gemini.generate_json(
                prompt,
                system_instruction=INSIGHTS_SYSTEM_PROMPT,
                temperature=0.15,
                max_output_tokens=1500,
            )
        except AIProviderError as exc:
            raise ValueError(str(exc)) from exc

        try:
            return RepoInsights(
                overview=self._text(payload.get("overview")),
                architecture=self._text(payload.get("architecture")),
                onboarding=self._text(payload.get("onboarding")),
                entry_points=self._list(payload.get("entry_points")),
                risks=self._list(payload.get("risks")),
                suggested_questions=self._list(payload.get("suggested_questions")),
                generated_at=datetime.now(UTC),
                model=self.settings.gemini_model,
            )
        except Exception as exc:
            raise ValueError(f"Gemini returned an invalid repository briefing: {exc}") from exc

    @staticmethod
    def _text(value: Any) -> str:
        if isinstance(value, str):
            return value.strip()
        if isinstance(value, list):
            return " ".join(str(item).strip() for item in value if str(item).strip())
        return ""

    @staticmethod
    def _list(value: Any) -> list[str]:
        if not isinstance(value, list):
            return []
        cleaned: list[str] = []
        for item in value:
            text = str(item).strip()
            if text and text not in cleaned:
                cleaned.append(text)
        return cleaned[:8]
