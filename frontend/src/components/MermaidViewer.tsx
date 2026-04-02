import { useEffect, useId, useState } from "react";
import mermaid from "mermaid";

type MermaidViewerProps = {
  chart: string;
};

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "loose",
  theme: "neutral"
});

export function MermaidViewer({ chart }: MermaidViewerProps) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const elementId = useId();

  useEffect(() => {
    let cancelled = false;

    mermaid
      .render(`mermaid-${elementId}`, chart)
      .then(({ svg: renderedSvg }) => {
        if (!cancelled) {
          setSvg(renderedSvg);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Diagram could not be rendered.");
        }
      });

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
