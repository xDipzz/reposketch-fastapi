from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import urlparse


GITHUB_NETLOCS = {"github.com", "www.github.com"}


def slugify_repo_name(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "repository"


def parse_github_repo_url(repo_url: str) -> tuple[str, str]:
    parsed = urlparse(repo_url.strip())
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Repository URL must use http or https.")
    if parsed.netloc.lower() not in GITHUB_NETLOCS:
        raise ValueError("Only GitHub repository URLs are supported right now.")

    path_parts = [part for part in parsed.path.split("/") if part]
    if len(path_parts) < 2:
        raise ValueError("Repository URL must include both owner and repository name.")

    owner = path_parts[0]
    repo_name = path_parts[1]
    if repo_name.endswith(".git"):
        repo_name = repo_name[:-4]

    repo_id = slugify_repo_name(f"{owner}-{repo_name}")
    return repo_id, repo_name


def relative_posix_path(path: Path, root: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def module_name_from_path(relative_path: str) -> str | None:
    path = Path(relative_path)
    if path.suffix.lower() != ".py":
        return None

    parts = list(path.with_suffix("").parts)
    if not parts:
        return None
    if parts[-1] == "__init__":
        parts = parts[:-1]
    return ".".join(parts) if parts else None


def short_path_label(path_value: str, depth: int = 2) -> str:
    parts = Path(path_value).parts
    if len(parts) <= depth:
        return path_value
    return "/".join(parts[-depth:])


def collection_name(prefix: str, repo_id: str) -> str:
    return slugify_repo_name(f"{prefix}-{repo_id}").replace("-", "_")
