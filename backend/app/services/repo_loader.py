from __future__ import annotations

import os
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
            self._enforce_repo_limits(destination)
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

        self._enforce_repo_limits(destination)

        return LoadedRepository(
            repo_id=repo_id,
            repo_name=repo_name,
            repo_url=repo_url,
            local_path=destination,
            warnings=warnings,
        )

    def _enforce_repo_limits(self, destination: Path) -> None:
        total_bytes = 0
        total_files = 0
        for root, dir_names, file_names in os.walk(destination):
            dir_names[:] = [name for name in dir_names if name != ".git"]
            for file_name in file_names:
                path = Path(root) / file_name
                try:
                    total_bytes += path.stat().st_size
                except OSError:
                    continue
                total_files += 1
                if total_files > self.settings.max_repo_files:
                    shutil.rmtree(destination, ignore_errors=True)
                    raise ValueError(
                        f"Repository has more than {self.settings.max_repo_files} files. "
                        "Try a smaller Python package."
                    )
                if total_bytes > self.settings.max_repo_size_mb * 1024 * 1024:
                    shutil.rmtree(destination, ignore_errors=True)
                    raise ValueError(
                        f"Repository is larger than {self.settings.max_repo_size_mb} MB. "
                        "Try a smaller Python package."
                    )
