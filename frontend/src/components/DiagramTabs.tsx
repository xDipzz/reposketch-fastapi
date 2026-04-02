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
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full">
        <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-500 font-medium">Generating repository diagrams...</p>
      </div>
    );
  }

  if (!diagrams.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">Mermaid diagrams will appear here once analyzed.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full w-full">
      <div className="w-full md:w-64 lg:w-80 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50 overflow-y-auto shrink-0">
        <div className="p-4 border-b border-gray-200 sticky top-0 bg-gray-50/90 backdrop-blur z-10">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Views ({diagrams.length})</h3>
        </div>
        <div className="p-2 space-y-1">
          {diagrams.map((diagram, index) => {
            const isActive = diagram.id === activeDiagram?.id;
            return (
              <button
                key={diagram.id}
                className={`w-full text-left px-3 py-3 rounded-lg transition-colors border ${
                  isActive 
                    ? "bg-white border-gray-200 shadow-sm" 
                    : "border-transparent hover:bg-gray-100/50"
                }`}
                onClick={() => setActiveId(diagram.id)}
              >
                <div className="flex items-baseline gap-2">
                  <span className={`font-mono text-xs font-bold ${isActive ? "text-blue-600" : "text-gray-400"}`}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <strong className={`block text-sm font-semibold truncate ${isActive ? "text-gray-900" : "text-gray-700"}`}>
                    {diagram.title}
                  </strong>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full min-w-0 bg-white">
        {activeDiagram ? (
          <>
            <div className="p-6 border-b border-gray-200 shrink-0">
              <h3 className="text-xl font-bold text-gray-900">{activeDiagram.title}</h3>
              <p className="text-gray-600 mt-2 text-sm leading-relaxed max-w-4xl">{activeDiagram.description}</p>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-slate-50 relative">
              <MermaidViewer chart={activeDiagram.mermaid} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
