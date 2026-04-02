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
  const layoutMode =
    activeDiagram?.id === "project-structure" ? "fit-width" : "natural";

  useEffect(() => {
    setActiveId(diagrams[0]?.id ?? null);
  }, [diagrams]);

  if (loading) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center p-12 text-center">
        <svg className="mb-4 h-8 w-8 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="font-medium text-gray-500">Generating repository diagrams...</p>
      </div>
    );
  }

  if (!diagrams.length) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center p-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="font-medium text-gray-500">Mermaid diagrams will appear here once analyzed.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      <div className="border-b border-gray-200 bg-slate-50/80 px-4 py-4 md:px-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.24em] text-gray-500">
            Views ({diagrams.length})
          </h3>
          <p className="hidden text-xs text-gray-500 lg:block">
            {layoutMode === "fit-width"
              ? "Project structure is fitted to the stage."
              : "Use zoom or full screen for dense diagrams."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {diagrams.map((diagram, index) => {
            const isActive = diagram.id === activeDiagram?.id;
            return (
              <button
                key={diagram.id}
                className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                  isActive
                    ? "border-blue-200 bg-white shadow-sm ring-2 ring-blue-100"
                    : "border-gray-200 bg-white/70 hover:bg-white"
                }`}
                onClick={() => setActiveId(diagram.id)}
                type="button"
              >
                <div className="flex items-baseline gap-2">
                  <span className={`font-mono text-xs font-bold ${isActive ? "text-blue-600" : "text-gray-400"}`}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <strong className={`block text-sm font-semibold ${isActive ? "text-gray-900" : "text-gray-700"}`}>
                    {diagram.title}
                  </strong>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col bg-white">
        {activeDiagram ? (
          <>
            <div className="shrink-0 border-b border-gray-200 px-6 py-5">
              <h3 className="text-xl font-bold text-gray-900">{activeDiagram.title}</h3>
              <p className="mt-2 max-w-4xl text-sm leading-relaxed text-gray-600">{activeDiagram.description}</p>
            </div>
            <div className="bg-slate-50 px-4 py-4 md:px-6 md:py-6">
              <MermaidViewer chart={activeDiagram.mermaid} layoutMode={layoutMode} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
