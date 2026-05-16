import { useEffect, useState } from "react";

import type { Diagram } from "../api/client";
import { MermaidViewer } from "./MermaidViewer";

const FIT_WIDTH_DIAGRAM_IDS = new Set(["project-structure", "file-dependencies"]);

type DiagramTabsProps = {
  diagrams: Diagram[];
  loading: boolean;
};

export function DiagramTabs({ diagrams, loading }: DiagramTabsProps) {
  const [activeId, setActiveId] = useState<string | null>(diagrams[0]?.id ?? null);
  const activeDiagram = diagrams.find((diagram) => diagram.id === activeId) ?? diagrams[0] ?? null;
  const layoutMode =
    activeDiagram && FIT_WIDTH_DIAGRAM_IDS.has(activeDiagram.id) ? "fit-width" : "natural";

  useEffect(() => {
    setActiveId(diagrams[0]?.id ?? null);
  }, [diagrams]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[34rem] flex-1 flex-col justify-center p-10">
        <div className="mx-auto w-full max-w-2xl space-y-4">
          <div className="h-2 w-28 rounded-full bg-white signal-pulse" />
          <div className="h-5 w-2/3 rounded-full bg-white/10" />
          <div className="h-5 w-1/2 rounded-full bg-white/10" />
          <div className="h-64 rounded-2xl border border-white/10 bg-white/[0.04]" />
          <p className="text-sm font-semibold text-slate-500">Generating repository diagrams...</p>
        </div>
      </div>
    );
  }

  if (!diagrams.length) {
    return (
      <div className="flex h-full min-h-[34rem] flex-1 flex-col items-center justify-center p-12 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] font-mono text-sm font-bold text-slate-500 shadow-sm">
          MD
        </div>
        <p className="font-semibold text-slate-500">Mermaid diagrams will appear here once analyzed.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      <div className="border-b border-white/10 bg-black/25 px-4 py-4 backdrop-blur md:px-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
            Views ({diagrams.length})
          </h3>
          <p className="hidden text-xs font-medium text-slate-500 lg:block">
            {layoutMode === "fit-width"
              ? "Diagram is fitted to the stage."
              : "Use zoom or full screen for dense diagrams."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {diagrams.map((diagram, index) => {
            const isActive = diagram.id === activeDiagram?.id;
            return (
              <button
                key={diagram.id}
                className={`rounded-lg border px-4 py-3 text-left transition-all duration-200 ${
                  isActive
                    ? "border-white bg-white text-black shadow-[0_16px_60px_-40px_rgba(255,255,255,0.8)]"
                    : "border-white/10 bg-white/[0.045] text-slate-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08]"
                }`}
                onClick={() => setActiveId(diagram.id)}
                type="button"
              >
                <div className="flex items-baseline gap-2">
                  <span className={`font-mono text-xs font-bold ${isActive ? "text-black/45" : "text-slate-600"}`}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <strong className="block text-sm font-semibold">
                    {diagram.title}
                  </strong>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col bg-black/15">
        {activeDiagram ? (
          <>
            <div className="shrink-0 border-b border-white/10 px-6 py-5">
              <h3 className="text-xl font-bold text-white">{activeDiagram.title}</h3>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">{activeDiagram.description}</p>
            </div>
            <div className="bg-black/20 px-4 py-4 md:px-6 md:py-6">
              <MermaidViewer chart={activeDiagram.mermaid} layoutMode={layoutMode} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
