import { useEffect, useState } from "react";

import type { Diagram } from "../api/client";
import { MermaidViewer } from "./MermaidViewer";

type DiagramTabsProps = {
  diagrams: Diagram[];
  loading: boolean;
};

export function DiagramTabs({ diagrams, loading }: DiagramTabsProps) {
  const [activeId, setActiveId] = useState<string | null>(diagrams[0]?.id ?? null);
  const activeDiagram = diagrams.find((diagram) => diagram.id === activeId) ?? diagrams[0] ?? null;

  useEffect(() => {
    setActiveId(diagrams[0]?.id ?? null);
  }, [diagrams]);

  if (loading) {
    return (
      <section className="panel diagram-panel">
        <p className="eyebrow">Architecture diagrams</p>
        <div className="placeholder-card">Generating repository diagrams...</div>
      </section>
    );
  }

  if (!diagrams.length) {
    return (
      <section className="panel diagram-panel">
        <p className="eyebrow">Architecture diagrams</p>
        <div className="placeholder-card">
          Mermaid diagrams will appear here once the repository structure has been analyzed.
        </div>
      </section>
    );
  }

  return (
    <section className="panel diagram-panel">
      <div className="diagram-header">
        <div>
          <p className="eyebrow">Architecture diagrams</p>
          <h2 className="panel-title">Diagram workspace</h2>
          <p className="panel-copy">
            Generated from parsed repository structure and internal import relationships.
          </p>
        </div>
        <div className="diagram-badge-group">
          <div className="badge">Mermaid</div>
          <div className="badge muted">{diagrams.length} views</div>
        </div>
      </div>

      <div className="diagram-tab-row">
        {diagrams.map((diagram, index) => (
          <button
            key={diagram.id}
            className={diagram.id === activeDiagram?.id ? "tab active diagram-tab" : "tab diagram-tab"}
            onClick={() => setActiveId(diagram.id)}
            type="button"
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{diagram.title}</strong>
          </button>
        ))}
      </div>

      {activeDiagram ? (
        <div className="diagram-stage">
          <div className="diagram-stage-head">
            <div>
              <p className="mini-label">Active view</p>
              <h3>{activeDiagram.title}</h3>
            </div>
            <p className="diagram-description">{activeDiagram.description}</p>
          </div>

          <div className="diagram-canvas">
            <MermaidViewer chart={activeDiagram.mermaid} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
