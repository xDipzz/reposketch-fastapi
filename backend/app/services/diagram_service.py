from __future__ import annotations

import re

import networkx as nx

from app.schemas import DiagramData, RepoMetadata
from app.services.graph_builder import GraphBundle


class DiagramService:
    def build_diagrams(self, metadata: RepoMetadata, graphs: GraphBundle) -> list[DiagramData]:
        return [
            DiagramData(
                id="project-structure",
                title="Project structure",
                description="Top-level folders and representative files extracted directly from the repository tree.",
                mermaid=self._to_mermaid(graphs.structure, orientation="TD"),
            ),
            DiagramData(
                id="file-dependencies",
                title="File dependencies",
                description="Internal Python import relationships resolved from parsed AST import statements.",
                mermaid=self._to_mermaid(graphs.dependencies, orientation="LR"),
            ),
            DiagramData(
                id="module-relationships",
                title="Module relationships",
                description="High-level module and service relationships grouped by top-level package or folder.",
                mermaid=self._to_mermaid(graphs.modules, orientation="LR"),
            ),
        ]

    def _to_mermaid(self, graph: nx.DiGraph, orientation: str) -> str:
        if not graph.nodes:
            return 'flowchart TD\n    empty["No repository structure detected"]'

        lines = [f"flowchart {orientation}"]
        style_buckets: dict[str, list[str]] = {"repo": [], "folder": [], "file": [], "module": []}

        for node, attrs in graph.nodes(data=True):
            node_id = self._node_id(node)
            label = self._escape_label(attrs.get("label", str(node)))
            node_kind = attrs.get("kind", "file")
            lines.append(f'    {node_id}["{label}"]')
            style_buckets.setdefault(node_kind, []).append(node_id)

        for source, target, attrs in graph.edges(data=True):
            source_id = self._node_id(source)
            target_id = self._node_id(target)
            edge_label = attrs.get("label")
            if edge_label and graph.number_of_edges() <= 18:
                label = self._escape_label(str(edge_label))
                lines.append(f'    {source_id} -- "{label}" --> {target_id}')
            else:
                lines.append(f"    {source_id} --> {target_id}")

        lines.extend(
            [
                "    classDef repo fill:#FDF2E1,stroke:#C64F13,color:#342118,stroke-width:2px;",
                "    classDef folder fill:#FFF4E2,stroke:#B6722A,color:#342118;",
                "    classDef file fill:#FFFFFF,stroke:#A48B76,color:#342118;",
                "    classDef module fill:#FAEEE4,stroke:#8A4F2C,color:#342118;",
            ]
        )

        for kind, node_ids in style_buckets.items():
            if node_ids:
                lines.append(f"    class {','.join(node_ids)} {kind};")

        return "\n".join(lines)

    @staticmethod
    def _node_id(value: str) -> str:
        return "n_" + re.sub(r"[^a-zA-Z0-9_]", "_", value)

    @staticmethod
    def _escape_label(value: str) -> str:
        return value.replace('"', "'")
