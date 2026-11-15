from __future__ import annotations

import hashlib
import re
import sqlite3
import threading
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Mapping

from app.config import Settings, get_settings


ACTION_COSTS: dict[str, tuple[str, int]] = {
    "repo_load": ("Analyze repository", 10),
    "index": ("Build retrieval index", 20),
    "insights": ("Generate AI briefing", 5),
    "ask": ("Ask the repository", 2),
}


@dataclass(slots=True)
class UsageSnapshot:
    limit: int
    used: int
    remaining: int
    reset_at: datetime
    costs: list[dict[str, str | int]]

    def as_dict(self) -> dict[str, object]:
        return {
            "limit": self.limit,
            "used": self.used,
            "remaining": self.remaining,
            "reset_at": self.reset_at,
            "costs": self.costs,
        }


class UsageLimitError(ValueError):
    def __init__(self, message: str, *, remaining: int, reset_at: datetime) -> None:
        super().__init__(message)
        self.remaining = remaining
        self.reset_at = reset_at


class UsageService:
    """Per-browser daily credits with an IP backstop.

    The service is intentionally anonymous: a client-generated ID is used when
    available, otherwise the request IP. A second IP-level bucket limits trivial
    client-ID resets. For hard production enforcement, pair this with real auth.
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.path = self.settings.analysis_storage_dir / "usage.sqlite3"
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=30)
        connection.execute("PRAGMA journal_mode=WAL")
        connection.execute("PRAGMA synchronous=NORMAL")
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS daily_usage (
                    user_key TEXT NOT NULL,
                    day TEXT NOT NULL,
                    used INTEGER NOT NULL DEFAULT 0,
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY (user_key, day)
                )
                """
            )

    def identify(self, headers: Mapping[str, str], client_host: str | None) -> tuple[str, str]:
        raw_client_id = (headers.get("x-client-id") or "").strip()
        if not re.fullmatch(r"[A-Za-z0-9_-]{8,80}", raw_client_id):
            raw_client_id = ""

        forwarded = (headers.get("x-forwarded-for") or "").split(",")[0].strip()
        ip = forwarded or client_host or "unknown"
        ip_hash = hashlib.blake2b(ip.encode("utf-8"), digest_size=12).hexdigest()
        ip_key = f"ip:{ip_hash}"
        client_key = f"client:{raw_client_id}" if raw_client_id else ip_key
        return client_key, ip_key

    def snapshot(self, client_key: str, ip_key: str) -> UsageSnapshot:
        now = datetime.now(UTC)
        day = now.date().isoformat()
        with self._connect() as connection:
            row = connection.execute(
                "SELECT used FROM daily_usage WHERE user_key = ? AND day = ?",
                (client_key, day),
            ).fetchone()
            used = int(row["used"]) if row else 0
        limit = self.settings.daily_credit_limit
        return UsageSnapshot(
            limit=limit,
            used=used,
            remaining=max(0, limit - used),
            reset_at=self._next_reset(now),
            costs=self._cost_rows(),
        )

    def consume(self, client_key: str, ip_key: str, action: str) -> UsageSnapshot:
        if action not in ACTION_COSTS:
            raise ValueError(f"Unknown credit action: {action}")
        cost = ACTION_COSTS[action][1]
        keys = self._keys(client_key, ip_key)
        now = datetime.now(UTC)
        day = now.date().isoformat()
        reset_at = self._next_reset(now)

        with self._lock, self._connect() as connection:
            for key, limit in keys:
                row = connection.execute(
                    "SELECT used FROM daily_usage WHERE user_key = ? AND day = ?",
                    (key, day),
                ).fetchone()
                used = int(row["used"]) if row else 0
                if used + cost > limit:
                    raise UsageLimitError(
                        "Daily credit limit reached. "
                        f"{max(0, limit - used)} credit(s) remain today. "
                        f"Credits reset at {reset_at.isoformat()}.",
                        remaining=max(0, limit - used),
                        reset_at=reset_at,
                    )

            for key, _limit in keys:
                connection.execute(
                    """
                    INSERT INTO daily_usage(user_key, day, used, updated_at)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(user_key, day) DO UPDATE SET
                        used = daily_usage.used + excluded.used,
                        updated_at = excluded.updated_at
                    """,
                    (key, day, cost, now.isoformat()),
                )

        return self.snapshot(client_key, ip_key)

    def refund(self, client_key: str, ip_key: str, action: str) -> None:
        if action not in ACTION_COSTS:
            return
        cost = ACTION_COSTS[action][1]
        now = datetime.now(UTC)
        day = now.date().isoformat()
        with self._lock, self._connect() as connection:
            for key, _limit in self._keys(client_key, ip_key):
                connection.execute(
                    """
                    UPDATE daily_usage
                    SET used = MAX(0, used - ?), updated_at = ?
                    WHERE user_key = ? AND day = ?
                    """,
                    (cost, now.isoformat(), key, day),
                )

    def _keys(self, client_key: str, ip_key: str) -> list[tuple[str, int]]:
        if client_key == ip_key:
            return [(client_key, self.settings.daily_credit_limit)]
        return [
            (client_key, self.settings.daily_credit_limit),
            (ip_key, self.settings.ip_daily_credit_limit),
        ]

    @staticmethod
    def _next_reset(now: datetime) -> datetime:
        return (now + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

    @staticmethod
    def _cost_rows() -> list[dict[str, str | int]]:
        return [
            {"action": action, "label": label, "cost": cost}
            for action, (label, cost) in ACTION_COSTS.items()
        ]

    @property
    def database_path(self) -> Path:
        return self.path
