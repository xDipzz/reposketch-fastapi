from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path

import networkx as nx

from app.schemas import RepoMetadata
from app.utils.path_utils import short_path_label


@dataclass(slots=True)
class GraphBundle:
    structure: nx.DiGraph
    dependencies: nx.DiGraph
    modules: nx.DiGraph


class GraphBuilder:
    def build(self, metadata: RepoMetadata) -> GraphBundle:
        return GraphBundle(
            structure=self.build_structure_graph(metadata),
            dependencies=self.build_dependency_graph(metadata),
            modules=self.build_module_graph(metadata),
        )

    def build_structure_graph(self, metadata: RepoMetadata) -> nx.DiGraph:
        graph = nx.DiGraph()
        root_node = metadata.repo_name
        graph.add_node(root_node, label=metadata.repo_name, kind="repo")

        grouped: defaultdict[str, list[str]] = defaultdict(list)
        for file in metadata.files:
            path = Path(file.path)
            top_key = path.parts[0] if len(path.parts) > 1 else "__root__"
            grouped[top_key].append(file.path)

        selected_paths: set[str] = set()
        for file in metadata.files:
            if len(Path(file.path).parts) == 1:
                selected_paths.add(file.path)
            if file.is_entry_point or file.is_important:
                selected_paths.add(file.path)

        for folder_name, items in grouped.items():
            if folder_name == "__root__":
                continue
            ranked = sorted(
                items,
                key=lambda item: (
                    0 if item in metadata.entry_points else 1,
                    0 if item in metadata.important_files else 1,
                    item.count("/"),
                    item,
                ),
            )
            selected_paths.update(ranked[:4])

        for relative_path in sorted(selected_paths):
            parts = Path(relative_path).parts
            parent = root_node
            built_parts: list[str] = []
            for index, part in enumerate(parts):
                built_parts.append(part)
                node_name = "/".join(built_parts)
                kind = "file" if index == len(parts) - 1 else "folder"
                graph.add_node(node_name, label=part, kind=kind)
                graph.add_edge(parent, node_name)
                parent = node_name

        return graph

    def build_dependency_graph(self, metadata: RepoMetadata) -> nx.DiGraph:
        graph = nx.DiGraph()
        for file in metadata.files:
            if file.extension == ".py":
                graph.add_node(file.path, label=short_path_label(file.path), kind="file")

        for edge in metadata.import_edges:
            graph.add_edge(edge.source, edge.target, label=edge.module)

        if len(graph.nodes) <= 24:
            return graph

        keep_nodes = set(metadata.entry_points)
        keep_nodes.update(edge.source for edge in metadata.import_edges[:8])
        keep_nodes.update(edge.target for edge in metadata.import_edges[:8])
        degree_ranked = [
            node
            for node, _degree in sorted(graph.degree, key=lambda item: item[1], reverse=True)
        ]
        keep_nodes.update(degree_ranked[:24])
        trimmed = graph.subgraph([node for node in keep_nodes if node in graph]).copy()
        return trimmed

    def build_module_graph(self, metadata: RepoMetadata) -> nx.DiGraph:
        graph = nx.DiGraph()
        for module in metadata.major_modules:
            graph.add_node(module, label=module, kind="module")

        edge_weights: Counter[tuple[str, str]] = Counter()
        for edge in metadata.import_edges:
            source_module = self._top_level_group(edge.source)
            target_module = self._top_level_group(edge.target)
            if not source_module or not target_module or source_module == target_module:
                continue
            edge_weights[(source_module, target_module)] += 1
            graph.add_node(source_module, label=source_module, kind="module")
            graph.add_node(target_module, label=target_module, kind="module")

        for (source, target), weight in edge_weights.items():
            graph.add_edge(source, target, label=str(weight), weight=weight)

        return graph

    @staticmethod
    def _top_level_group(path_value: str) -> str:
        path = Path(path_value)
        if len(path.parts) > 1:
            return path.parts[0]
        return path.stem
