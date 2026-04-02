from __future__ import annotations

import os
from pathlib import Path


IGNORED_DIRECTORIES = {
    ".git",
    "node_modules",
    "dist",
    "build",
    ".venv",
    "venv",
    "__pycache__",
}


LANGUAGE_BY_EXTENSION = {
    ".py": "python",
    ".md": "markdown",
    ".txt": "text",
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".toml": "toml",
    ".ini": "config",
    ".cfg": "config",
}


def detect_language(path: Path) -> str:
    return LANGUAGE_BY_EXTENSION.get(path.suffix.lower(), "text")


def is_allowed_extension(path: Path, allowed_extensions: tuple[str, ...]) -> bool:
    return path.suffix.lower() in {item.lower() for item in allowed_extensions}


def is_too_large(path: Path, max_file_size_kb: int) -> bool:
    return path.stat().st_size > max_file_size_kb * 1024


def iter_repository_files(
    root: Path, allowed_extensions: tuple[str, ...], max_file_size_kb: int
) -> list[Path]:
    files: list[Path] = []
    for current_root, dir_names, file_names in os.walk(root):
        dir_names[:] = sorted(
            name for name in dir_names if name not in IGNORED_DIRECTORIES and not name.startswith(".")
        )
        for file_name in sorted(file_names):
            path = Path(current_root) / file_name
            if not is_allowed_extension(path, allowed_extensions):
                continue
            if is_too_large(path, max_file_size_kb):
                continue
            files.append(path)
    return files


def read_text_file(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="ignore")
