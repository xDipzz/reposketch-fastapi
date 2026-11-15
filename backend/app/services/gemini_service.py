from __future__ import annotations

import json
import math
import re
import time
from typing import Any

import httpx

from app.config import Settings, get_settings


class AIProviderError(RuntimeError):
    """Raised when the upstream free AI provider cannot answer."""


class GeminiService:
    """Small dependency-free client for the Google Gemini REST API.

    The project intentionally uses REST instead of a vendor SDK so the backend
    stays lightweight enough for Render's 512 MB free instance.
    """

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    @property
    def configured(self) -> bool:
        return bool(self.settings.gemini_api_key)

    def _candidate_models(self) -> list[str]:
        candidates = [
            self.settings.gemini_model,
            "gemini-2.5-flash-lite",
            "gemini-flash-lite-latest",
        ]
        return list(dict.fromkeys(model for model in candidates if model))

    def _embedding_models(self) -> list[str]:
        candidates = [
            self.settings.gemini_embedding_model,
            "text-embedding-004",
        ]
        return list(dict.fromkeys(model for model in candidates if model))

    def _post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        if not self.configured:
            raise AIProviderError(
                "GEMINI_API_KEY is missing. Add it to backend/.env or the Render dashboard."
            )

        headers = {
            "x-goog-api-key": str(self.settings.gemini_api_key),
            "Content-Type": "application/json",
        }
        url = f"{self.BASE_URL}/{path}"
        last_error: Exception | None = None

        for attempt in range(self.settings.gemini_max_retries + 1):
            try:
                response = httpx.post(
                    url,
                    headers=headers,
                    json=payload,
                    timeout=self.settings.gemini_timeout_seconds,
                )
            except httpx.HTTPError as exc:
                last_error = exc
                if attempt < self.settings.gemini_max_retries:
                    time.sleep(1.5 * (attempt + 1))
                    continue
                raise AIProviderError(f"Could not reach Gemini: {exc}") from exc

            if response.status_code in {429, 500, 502, 503, 504}:
                last_error = AIProviderError(
                    f"Gemini temporarily unavailable (HTTP {response.status_code})."
                )
                if attempt < self.settings.gemini_max_retries:
                    retry_after = response.headers.get("retry-after")
                    delay = float(retry_after) if retry_after and retry_after.isdigit() else 1.5 * (attempt + 1)
                    time.sleep(min(delay, 12))
                    continue

            if response.status_code >= 400:
                detail = self._error_detail(response)
                raise AIProviderError(
                    f"Gemini request failed (HTTP {response.status_code}): {detail}"
                )

            try:
                return response.json()
            except ValueError as exc:
                raise AIProviderError("Gemini returned a non-JSON response.") from exc

        raise AIProviderError(str(last_error or "Gemini request failed."))

    @staticmethod
    def _error_detail(response: httpx.Response) -> str:
        try:
            payload = response.json()
            message = payload.get("error", {}).get("message", "")
            if message:
                return str(message)[:400]
        except ValueError:
            pass
        return response.text[:400] or "no error detail"

    def generate_text(
        self,
        prompt: str,
        *,
        system_instruction: str | None = None,
        temperature: float = 0.2,
        max_output_tokens: int = 1400,
    ) -> str:
        payload: dict[str, Any] = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_output_tokens,
            },
        }
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        errors: list[str] = []
        for model in self._candidate_models():
            try:
                data = self._post(f"models/{model}:generateContent", payload)
                text = self._extract_text(data)
                if text:
                    return text
                errors.append(f"{model}: empty response")
            except AIProviderError as exc:
                errors.append(f"{model}: {exc}")
                if "HTTP 400" in str(exc) or "HTTP 403" in str(exc):
                    break

        raise AIProviderError(
            "No Gemini model could answer. " + " | ".join(errors[-3:])
        )

    def generate_json(
        self,
        prompt: str,
        *,
        system_instruction: str | None = None,
        temperature: float = 0.15,
        max_output_tokens: int = 1600,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_output_tokens,
                "responseMimeType": "application/json",
            },
        }
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        errors: list[str] = []
        for model in self._candidate_models():
            try:
                data = self._post(f"models/{model}:generateContent", payload)
                text = self._extract_text(data)
                if not text:
                    errors.append(f"{model}: empty response")
                    continue
                parsed = self._parse_json(text)
                if isinstance(parsed, dict):
                    return parsed
                errors.append(f"{model}: JSON was not an object")
            except (AIProviderError, ValueError) as exc:
                errors.append(f"{model}: {exc}")

        raise AIProviderError(
            "Gemini did not return usable JSON. " + " | ".join(errors[-3:])
        )

    def embed_texts(
        self,
        texts: list[str],
        *,
        task_type: str = "RETRIEVAL_DOCUMENT",
    ) -> list[list[float]]:
        if not texts:
            return []
        if not self.configured:
            raise AIProviderError("GEMINI_API_KEY is missing.")

        vectors: list[list[float]] = []
        batch_size = self.settings.embedding_batch_size
        for start in range(0, len(texts), batch_size):
            batch = texts[start : start + batch_size]
            vectors.extend(self._embed_batch(batch, task_type=task_type))
        return vectors

    def embed_query(self, text: str) -> list[float]:
        vectors = self.embed_texts([text], task_type="RETRIEVAL_QUERY")
        return vectors[0]

    def _embed_batch(self, texts: list[str], *, task_type: str) -> list[list[float]]:
        errors: list[str] = []
        for model in self._embedding_models():
            payload = {
                "requests": [
                    {
                        "model": f"models/{model}",
                        "content": {"parts": [{"text": text}]},
                        "taskType": task_type,
                        "outputDimensionality": self.settings.gemini_embedding_dimensions,
                    }
                    for text in texts
                ]
            }
            try:
                data = self._post(f"models/{model}:batchEmbedContents", payload)
                embeddings = data.get("embeddings")
                if not isinstance(embeddings, list) or len(embeddings) != len(texts):
                    errors.append(f"{model}: unexpected embedding count")
                    continue
                batch_vectors: list[list[float]] = []
                for embedding in embeddings:
                    values = embedding.get("values") if isinstance(embedding, dict) else None
                    if not isinstance(values, list) or not values:
                        raise AIProviderError(f"{model} returned an empty embedding.")
                    batch_vectors.append(self._normalize([float(value) for value in values]))
                return batch_vectors
            except AIProviderError as exc:
                errors.append(f"{model}: {exc}")

        raise AIProviderError(
            "Gemini embeddings failed. " + " | ".join(errors[-2:])
        )

    @staticmethod
    def _normalize(vector: list[float]) -> list[float]:
        norm = math.sqrt(sum(value * value for value in vector))
        if norm <= 0:
            return vector
        return [value / norm for value in vector]

    @staticmethod
    def _extract_text(data: dict[str, Any]) -> str:
        candidates = data.get("candidates")
        if not isinstance(candidates, list) or not candidates:
            feedback = data.get("promptFeedback", {})
            reason = feedback.get("blockReason") if isinstance(feedback, dict) else None
            if reason:
                raise AIProviderError(f"Gemini blocked the request: {reason}")
            return ""

        candidate = candidates[0] if isinstance(candidates[0], dict) else {}
        content = candidate.get("content", {})
        parts = content.get("parts", []) if isinstance(content, dict) else []
        chunks = [
            str(part.get("text", ""))
            for part in parts
            if isinstance(part, dict) and part.get("text")
        ]
        text = "\n".join(chunk for chunk in chunks if chunk).strip()

        finish_reason = candidate.get("finishReason")
        if not text and finish_reason in {"SAFETY", "BLOCKLIST", "PROHIBITED_CONTENT"}:
            raise AIProviderError(f"Gemini blocked the response ({finish_reason}).")
        return text

    @staticmethod
    def _parse_json(text: str) -> Any:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(r"\s*```$", "", cleaned)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
            if not match:
                raise ValueError("No JSON object found in Gemini response.")
            return json.loads(match.group(0))
