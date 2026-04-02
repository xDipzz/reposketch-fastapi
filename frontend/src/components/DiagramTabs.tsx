import { useState } from "react";

import type { Diagram } from "../api/client";
import { MermaidViewer } from "./MermaidViewer";

type DiagramTabsProps = {
  diagrams: Diagram[];
  loading: boolean;
};

export function DiagramTabs({ diagrams, loading }: DiagramTabsProps) {
  const [activeId, setActiveId] = useState<string | null>(diagrams[0]?.id ?? null);
  const activeDiagram = diagrams.find((diagram) => diagram.id === activeId) ?? diagrams[0] ?? null;

  if (loading) {
    return (
      <section className="panel">
        <p className="eyebrow">Architecture diagrams</p>
        <div className="placeholder-card">Generating repository diagrams...</div>
      </section>
    );
  }

  if (!diagrams.length) {
    return (
      <section className="panel">
        <p className="eyebrow">Architecture diagrams</p>
        <div className="placeholder-card">
          Mermaid diagrams will appear here once the repository structure has been analyzed.
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Architecture diagrams</p>
          <h2 className="panel-title">Mermaid views</h2>
        </div>
      </div>

      <div className="tab-row">
        {diagrams.map((diagram) => (
          <button
            key={diagram.id}
            className={diagram.id === activeDiagram?.id ? "tab active" : "tab"}
            onClick={() => setActiveId(diagram.id)}
          >
            {diagram.title}
          </button>
        ))}
      </div>

      {activeDiagram ? (
        <div className="space-y-4">
          <p className="panel-copy">{activeDiagram.description}</p>
          <MermaidViewer chart={activeDiagram.mermaid} />
        </div>
      ) : null}
    </section>
  );
}
