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
    MAX_STRUCTURE_REPRESENTATIVES_PER_FOLDER = 3
    MAX_DEPENDENCY_NODES = 14
    MAX_DEPENDENCY_EDGES = 18
    SOURCE_LAYOUT_FOLDERS = {"src", "lib"}
    BOUNDARY_FOLDERS = {"tests", "examples"}

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
            selected_paths.update(ranked[: self.MAX_STRUCTURE_REPRESENTATIVES_PER_FOLDER])

        root_level_files = sorted(
            path_value for path_value in selected_paths if len(Path(path_value).parts) == 1
        )
        root_files_parent = root_node
        if len(root_level_files) > 3:
            root_files_parent = f"{root_node}/key-files"
            graph.add_node(root_files_parent, label="key files", kind="folder")
            graph.add_edge(root_node, root_files_parent)

        for relative_path in sorted(selected_paths):
            parts = Path(relative_path).parts
            parent = root_files_parent if len(parts) == 1 and root_files_parent != root_node else root_node
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

        if (
            len(graph.nodes) <= self.MAX_DEPENDENCY_NODES
            and len(graph.edges) <= self.MAX_DEPENDENCY_EDGES
        ):
            return graph

        keep_nodes = self._select_dependency_nodes(graph, metadata)
        trimmed = graph.subgraph(keep_nodes).copy()

        if len(trimmed.edges) > self.MAX_DEPENDENCY_EDGES:
            ranked_edges = sorted(
                trimmed.edges(),
                key=lambda edge: self._dependency_edge_priority(trimmed, edge),
                reverse=True,
            )
            keep_edges = ranked_edges[: self.MAX_DEPENDENCY_EDGES]
            trimmed = self._trim_dependency_edges(trimmed, keep_edges, metadata)

        isolated_nodes = [
            node_name
            for node_name in list(trimmed.nodes)
            if trimmed.degree(node_name) == 0 and node_name not in metadata.entry_points
        ]
        for node_name in isolated_nodes:
            trimmed.remove_node(node_name)

        return trimmed

    def build_module_graph(self, metadata: RepoMetadata) -> nx.DiGraph:
        graph = nx.DiGraph()
        repo_node = f"repo::{metadata.repo_name}"
        graph.add_node(repo_node, label=f"{metadata.repo_name} repo", kind="repo")

        module_counts: Counter[str] = Counter()
        for file in metadata.files:
            path = Path(file.path)
            if len(path.parts) == 1 and file.extension != ".py":
                continue
            group_name = self._top_level_group(file.path)
            if group_name:
                module_counts[group_name] += 1

        for module_name, _count in module_counts.most_common(8):
            graph.add_node(module_name, label=module_name, kind="module")

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

        for node_name in list(graph.nodes):
            if node_name == repo_node:
                continue
            if not graph.has_edge(repo_node, node_name):
                graph.add_edge(repo_node, node_name, label="contains")

        return graph

    @staticmethod
    def _top_level_group(path_value: str) -> str:
        path = Path(path_value)
        if len(path.parts) > 2 and path.parts[0] in GraphBuilder.SOURCE_LAYOUT_FOLDERS:
            return path.parts[1]
        if len(path.parts) > 1:
            return path.parts[0]
        return path.stem

    def _select_dependency_nodes(
        self, graph: nx.DiGraph, metadata: RepoMetadata
    ) -> list[str]:
        entry_points = [node_name for node_name in metadata.entry_points if node_name in graph]
        source_nodes = [
            node_name
            for node_name in graph.nodes
            if self._path_category(node_name) == "source" and node_name not in entry_points
        ]
        boundary_nodes = [
            node_name
            for node_name in graph.nodes
            if self._path_category(node_name) == "boundary" and node_name not in entry_points
        ]
        other_nodes = [
            node_name
            for node_name in graph.nodes
            if self._path_category(node_name) == "other" and node_name not in entry_points
        ]

        source_nodes.sort(key=lambda node_name: self._dependency_node_priority(graph, node_name), reverse=True)
        boundary_nodes.sort(key=lambda node_name: self._dependency_node_priority(graph, node_name), reverse=True)
        other_nodes.sort(key=lambda node_name: self._dependency_node_priority(graph, node_name), reverse=True)

        ordered = [
            *entry_points,
            *source_nodes[:10],
            *boundary_nodes[:6],
            *source_nodes[10:],
            *boundary_nodes[6:],
            *other_nodes,
        ]

        unique_nodes: list[str] = []
        seen: set[str] = set()
        for node_name in ordered:
            if node_name in seen:
                continue
            seen.add(node_name)
            unique_nodes.append(node_name)
            if len(unique_nodes) >= self.MAX_DEPENDENCY_NODES:
                break

        return unique_nodes

    @staticmethod
    def _dependency_node_priority(graph: nx.DiGraph, node_name: str) -> tuple[int, int, int, str]:
        return (
            graph.degree(node_name),
            graph.in_degree(node_name),
            graph.out_degree(node_name),
            node_name,
        )

    def _dependency_edge_priority(
        self, graph: nx.DiGraph, edge: tuple[str, str]
    ) -> tuple[int, int, int, str, str]:
        source, target = edge
        has_boundary_file = int(
            self._path_category(source) == "boundary" or self._path_category(target) == "boundary"
        )
        return (
            has_boundary_file,
            graph.degree(source) + graph.degree(target),
            graph.out_degree(source) + graph.in_degree(target),
            source,
            target,
        )

    def _trim_dependency_edges(
        self,
        graph: nx.DiGraph,
        keep_edges: list[tuple[str, str]],
        metadata: RepoMetadata,
    ) -> nx.DiGraph:
        trimmed = nx.DiGraph()
        for source, target in keep_edges:
            trimmed.add_node(source, **graph.nodes[source])
            trimmed.add_node(target, **graph.nodes[target])
            trimmed.add_edge(source, target, **graph.edges[source, target])

        for node_name in metadata.entry_points:
            if node_name in graph and node_name not in trimmed:
                trimmed.add_node(node_name, **graph.nodes[node_name])

        return trimmed

    def _path_category(self, path_value: str) -> str:
        path = Path(path_value)
        if path.parts and path.parts[0] in self.SOURCE_LAYOUT_FOLDERS:
            return "source"
        if path.parts and path.parts[0] in self.BOUNDARY_FOLDERS:
            return "boundary"
        return "other"
