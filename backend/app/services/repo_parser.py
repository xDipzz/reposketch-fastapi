from __future__ import annotations

import ast
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path

from app.config import Settings, get_settings
from app.schemas import (
    FileAnalysis,
    ImportEdge,
    ImportStatement,
    RepoMetadata,
    RepoSummaryResponse,
    SymbolReference,
)
from app.services.repo_loader import LoadedRepository
from app.utils.file_utils import detect_language, iter_repository_files, read_text_file
from app.utils.path_utils import module_name_from_path, relative_posix_path


IMPORTANT_FILENAMES = {
    "README.md",
    "pyproject.toml",
    "requirements.txt",
    "setup.py",
    "Dockerfile",
    "docker-compose.yml",
    ".env.example",
}

ENTRYPOINT_FILENAMES = {
    "main.py",
    "app.py",
    "run.py",
    "server.py",
    "manage.py",
    "asgi.py",
    "wsgi.py",
}

FRAMEWORK_IMPORT_HINTS = {
    "FastAPI": {"fastapi"},
    "Flask": {"flask"},
    "Django": {"django"},
    "Streamlit": {"streamlit"},
    "Typer": {"typer"},
    "Click": {"click"},
}


class PythonMetadataVisitor(ast.NodeVisitor):
    def __init__(self) -> None:
        self.classes: list[SymbolReference] = []
        self.functions: list[SymbolReference] = []
        self.imports: list[ImportStatement] = []

    def visit_ClassDef(self, node: ast.ClassDef) -> None:
        if isinstance(getattr(node, "parent", None), ast.Module):
            self.classes.append(
                SymbolReference(
                    name=node.name,
                    kind="class",
                    line_start=node.lineno,
                    line_end=getattr(node, "end_lineno", node.lineno),
                )
            )
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        if isinstance(getattr(node, "parent", None), ast.Module):
            self.functions.append(
                SymbolReference(
                    name=node.name,
                    kind="function",
                    line_start=node.lineno,
                    line_end=getattr(node, "end_lineno", node.lineno),
                )
            )
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
        if isinstance(getattr(node, "parent", None), ast.Module):
            self.functions.append(
                SymbolReference(
                    name=node.name,
                    kind="function",
                    line_start=node.lineno,
                    line_end=getattr(node, "end_lineno", node.lineno),
                )
            )
        self.generic_visit(node)

    def visit_Import(self, node: ast.Import) -> None:
        for imported in node.names:
            self.imports.append(ImportStatement(module=imported.name, names=[imported.name], level=0))

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        self.imports.append(
            ImportStatement(
                module=node.module,
                names=[imported.name for imported in node.names],
                level=node.level,
            )
        )


def build_repo_summary(metadata: RepoMetadata) -> RepoSummaryResponse:
    return RepoSummaryResponse(
        repo_id=metadata.repo_id,
        repo_name=metadata.repo_name,
        repo_url=metadata.repo_url,
        detected_framework=metadata.detected_framework,
        loaded_at=metadata.loaded_at,
        file_count=metadata.file_count,
        indexed_file_count=metadata.indexed_file_count,
        total_classes=metadata.total_classes,
        total_functions=metadata.total_functions,
        top_level_folders=metadata.top_level_folders,
        important_files=metadata.important_files,
        entry_points=metadata.entry_points,
        major_modules=metadata.major_modules,
        languages=metadata.languages,
    )


class RepoParser:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def parse_repository(self, loaded_repo: LoadedRepository) -> RepoMetadata:
        files: list[FileAnalysis] = []
        warnings = list(loaded_repo.warnings)

        candidate_files = iter_repository_files(
            loaded_repo.local_path,
            self.settings.allowed_code_extensions,
            self.settings.max_file_size_kb,
        )
        candidate_files.sort()

        for file_path in candidate_files:
            relative_path = relative_posix_path(file_path, loaded_repo.local_path)
            content = read_text_file(file_path)
            file_analysis = FileAnalysis(
                path=relative_path,
                extension=file_path.suffix.lower(),
                language=detect_language(file_path),
                size_bytes=file_path.stat().st_size,
                module_name=module_name_from_path(relative_path),
                is_entry_point=self._is_entry_point(relative_path, content),
                is_important=self._is_important(relative_path),
            )

            if file_path.suffix.lower() == ".py":
                try:
                    tree = ast.parse(content, filename=relative_path)
                    self._attach_parents(tree)
                    visitor = PythonMetadataVisitor()
                    visitor.visit(tree)
                    file_analysis.classes = visitor.classes
                    file_analysis.functions = visitor.functions
                    file_analysis.imports = visitor.imports
                except SyntaxError as exc:
                    warnings.append(
                        f"Could not parse {relative_path} with ast: line {exc.lineno} {exc.msg}."
                    )

            files.append(file_analysis)

        import_edges = self._build_import_edges(files)
        top_level_folders = self._extract_top_level_folders(files)
        important_files = self._extract_important_files(files)
        entry_points = self._extract_entry_points(files, top_level_folders)
        major_modules = self._extract_major_modules(files)
        detected_framework = self._detect_framework(files)
        languages = dict(Counter(file.language for file in files))

        return RepoMetadata(
            repo_id=loaded_repo.repo_id,
            repo_name=loaded_repo.repo_name,
            repo_url=loaded_repo.repo_url,
            local_path=str(loaded_repo.local_path),
            loaded_at=datetime.now(UTC),
            top_level_folders=top_level_folders,
            important_files=important_files,
            entry_points=entry_points,
            major_modules=major_modules,
            detected_framework=detected_framework,
            file_count=len(files),
            indexed_file_count=sum(
                1 for file in files if file.extension in self.settings.indexable_extensions
            ),
            total_classes=sum(len(file.classes) for file in files),
            total_functions=sum(len(file.functions) for file in files),
            languages=languages,
            files=files,
            import_edges=import_edges,
            warnings=warnings[:50],
        )

    @staticmethod
    def _attach_parents(tree: ast.AST) -> None:
        for parent in ast.walk(tree):
            for child in ast.iter_child_nodes(parent):
                setattr(child, "parent", parent)

    @staticmethod
    def _is_important(relative_path: str) -> bool:
        path = Path(relative_path)
        if path.name in IMPORTANT_FILENAMES:
            return True
        if len(path.parts) == 1 and path.suffix.lower() in {".md", ".toml", ".txt"}:
            return True
        return any(token in path.name.lower() for token in {"config", "settings", "requirements"})

    @staticmethod
    def _is_entry_point(relative_path: str, content: str) -> bool:
        path = Path(relative_path)
        if path.name in ENTRYPOINT_FILENAMES:
            return True
        if any(part.lower() in {"api", "apis", "route", "routes", "router", "routers"} for part in path.parts):
            return True
        return 'if __name__ == "__main__"' in content

    @staticmethod
    def _extract_top_level_folders(files: list[FileAnalysis]) -> list[str]:
        folders = {Path(file.path).parts[0] for file in files if len(Path(file.path).parts) > 1}
        return sorted(folders)

    @staticmethod
    def _extract_important_files(files: list[FileAnalysis]) -> list[str]:
        important = [file.path for file in files if file.is_important]
        important.sort(key=lambda item: (item.count("/"), item))
        return important[:12]

    @staticmethod
    def _extract_entry_points(files: list[FileAnalysis], top_level_folders: list[str]) -> list[str]:
        entries = {file.path for file in files if file.is_entry_point}
        entries.update(folder for folder in top_level_folders if folder.lower() in {"api", "routes", "routers"})
        return sorted(entries)[:16]

    @staticmethod
    def _extract_major_modules(files: list[FileAnalysis]) -> list[str]:
        module_counts: Counter[str] = Counter()
        for file in files:
            path = Path(file.path)
            if len(path.parts) > 1:
                module_counts[path.parts[0]] += 1
            elif file.extension == ".py":
                module_counts[path.stem] += 1
        return [name for name, _count in module_counts.most_common(8)]

    @staticmethod
    def _detect_framework(files: list[FileAnalysis]) -> str | None:
        scores: Counter[str] = Counter()
        for file in files:
            if file.path.endswith("manage.py"):
                scores["Django"] += 3
            for import_statement in file.imports:
                modules = [
                    import_statement.module or "",
                    *[
                        f"{import_statement.module}.{name}" if import_statement.module else name
                        for name in import_statement.names
                    ],
                ]
                for framework_name, hints in FRAMEWORK_IMPORT_HINTS.items():
                    if any(module.split(".")[0] in hints for module in modules if module):
                        scores[framework_name] += 1
        if not scores:
            return None
        return scores.most_common(1)[0][0]

    def _build_import_edges(self, files: list[FileAnalysis]) -> list[ImportEdge]:
        module_map = {
            file.module_name: file.path
            for file in files
            if file.module_name and file.extension == ".py"
        }
        edges: dict[tuple[str, str, str], ImportEdge] = {}

        for file in files:
            if file.extension != ".py" or not file.module_name:
                continue

            for import_statement in file.imports:
                for candidate in self._resolve_import_candidates(file.module_name, import_statement):
                    target_path = module_map.get(candidate)
                    if target_path and target_path != file.path:
                        key = (file.path, target_path, candidate)
                        edges[key] = ImportEdge(source=file.path, target=target_path, module=candidate)

        return sorted(edges.values(), key=lambda edge: (edge.source, edge.target, edge.module))

    def _resolve_import_candidates(
        self, current_module: str, import_statement: ImportStatement
    ) -> list[str]:
        candidates: list[str] = []

        if import_statement.level > 0:
            base_module = self._resolve_relative_module(
                current_module=current_module,
                module=import_statement.module,
                level=import_statement.level,
            )
            if base_module:
                candidates.append(base_module)
                candidates.extend(f"{base_module}.{name}" for name in import_statement.names)
        else:
            if import_statement.module:
                candidates.append(import_statement.module)
                candidates.extend(
                    f"{import_statement.module}.{name}" for name in import_statement.names
                )
            else:
                candidates.extend(import_statement.names)

        seen: set[str] = set()
        ordered: list[str] = []
        for candidate in candidates:
            if candidate and candidate not in seen:
                seen.add(candidate)
                ordered.append(candidate)
        return ordered

    @staticmethod
    def _resolve_relative_module(current_module: str, module: str | None, level: int) -> str:
        current_parts = current_module.split(".")
        package_parts = current_parts[:-1]
        if level > 1:
            package_parts = package_parts[: max(0, len(package_parts) - (level - 1))]
        if module:
            package_parts.extend(module.split("."))
        return ".".join(part for part in package_parts if part)
