from __future__ import annotations

import shutil
from dataclasses import dataclass, field
from pathlib import Path

from git import GitCommandError, Repo

from app.config import Settings, get_settings
from app.utils.path_utils import parse_github_repo_url


@dataclass(slots=True)
class LoadedRepository:
    repo_id: str
    repo_name: str
    repo_url: str
    local_path: Path
    warnings: list[str] = field(default_factory=list)


class RepoLoader:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def clone_repository(self, repo_url: str) -> LoadedRepository:
        repo_id, repo_name = parse_github_repo_url(repo_url)
        destination = self.settings.repo_storage_dir / repo_id
        warnings: list[str] = []

        if destination.exists() and (destination / ".git").exists():
            warnings.append("Existing clone reused from local storage.")
            return LoadedRepository(
                repo_id=repo_id,
                repo_name=repo_name,
                repo_url=repo_url,
                local_path=destination,
                warnings=warnings,
            )

        if destination.exists():
            shutil.rmtree(destination)

        try:
            Repo.clone_from(repo_url, destination, depth=1, single_branch=True)
        except GitCommandError as exc:
            raise ValueError(f"Failed to clone repository: {exc}") from exc

        return LoadedRepository(
            repo_id=repo_id,
            repo_name=repo_name,
            repo_url=repo_url,
            local_path=destination,
            warnings=warnings,
        )
