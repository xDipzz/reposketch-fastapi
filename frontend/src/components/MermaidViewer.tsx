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
          theme: "neutral"
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
    return <div className="placeholder-card">{error}</div>;
  }

  if (!svg) {
    return <div className="placeholder-card">Rendering Mermaid diagram...</div>;
  }

  return <div className="mermaid-shell" dangerouslySetInnerHTML={{ __html: svg }} />;
}
