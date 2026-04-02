import { useEffect, useId, useState } from "react";

type MermaidViewerProps = {
  chart: string;
};

export function MermaidViewer({ chart }: MermaidViewerProps) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const elementId = useId();

  useEffect(() => {
    let cancelled = false;
    const renderId = `mermaid-${elementId.replace(/:/g, "-")}`;

    async function renderDiagram() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "default",
        });
        const { svg: renderedSvg } = await mermaid.render(renderId, chart);
        if (!cancelled) {
          setSvg(renderedSvg);
          setError("");
        }
      } catch {
        if (!cancelled) {
          setError("Diagram could not be rendered.");
        }
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart, elementId]);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-8 bg-red-50 text-red-600 rounded-xl border border-red-200">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 backdrop-blur-sm">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500 font-medium">Rendering diagram...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center min-w-min min-h-min p-8 overflow-auto group"
    >
      <div 
        className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 transition-transform duration-300"
        dangerouslySetInnerHTML={{ __html: svg }} 
      />
    </div>
  );
}
