import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/icons/Icons";

export function MermaidViewer({
  chart,
  dark,
  title
}: {
  chart: string;
  dark: boolean;
  title?: string;
}) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState(false);
  const [copied, setCopied] = useState(false);
  const elementId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const renderId = `mermaid-${elementId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        const palette = dark
          ? {
              background: "#101215",
              primaryColor: "#242830",
              primaryTextColor: "#e8ebef",
              primaryBorderColor: "#9aa6b5",
              secondaryColor: "#1b1e24",
              tertiaryColor: "#20242b",
              lineColor: "#5c6673",
              textColor: "#e8ebef",
              mainBkg: "#171a1f",
              nodeBorder: "#596370",
              clusterBkg: "#15181d",
              clusterBorder: "#343a43",
              edgeLabelBackground: "#101215"
            }
          : {
              background: "#ffffff",
              primaryColor: "#eef2f6",
              primaryTextColor: "#1b1f26",
              primaryBorderColor: "#8794a3",
              secondaryColor: "#f4f6f8",
              tertiaryColor: "#e9edf1",
              lineColor: "#b7c0ca",
              textColor: "#1b1f26",
              mainBkg: "#ffffff",
              nodeBorder: "#aeb8c4",
              clusterBkg: "#f4f6f8",
              clusterBorder: "#d7dde3",
              edgeLabelBackground: "#ffffff"
            };

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "base",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          themeVariables: {
            ...palette,
            fontSize: "13px"
          },
          flowchart: {
            useMaxWidth: false,
            htmlLabels: true,
            curve: "basis",
            padding: 14
          }
        });

        const { svg: renderedSvg } = await mermaid.render(renderId, chart);
        if (!cancelled) {
          setSvg(normalizeSvg(renderedSvg));
          setError("");
        }
      } catch (renderError) {
        const message = renderError instanceof Error ? `${renderError.name}: ${renderError.message}` : String(renderError);
        console.error("Mermaid render failed", renderError);
        if (!cancelled) setError(`This diagram could not be rendered. ${message}`);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart, elementId, dark]);

  useEffect(() => {
    setZoom(1);
  }, [chart]);

  useEffect(() => {
    const container = containerRef.current;
    const svgElement = container?.querySelector("svg");
    if (!(svgElement instanceof SVGSVGElement) || !container) return;

    const viewBox = svgElement.viewBox.baseVal;
    const baseWidth = viewBox?.width || Number(svgElement.getAttribute("width")) || 1200;
    const baseHeight = viewBox?.height || Number(svgElement.getAttribute("height")) || 720;
    const available = Math.max((container.parentElement?.clientWidth ?? baseWidth) - 28, 320);
    const width = (fit ? available : Math.max(baseWidth, available)) * zoom;

    svgElement.style.width = `${Math.round(width)}px`;
    svgElement.style.height = `${Math.round((baseHeight / Math.max(baseWidth, 1)) * width)}px`;
    svgElement.style.maxWidth = "none";
  }, [svg, zoom, fit]);

  useEffect(() => {
    const scroller = containerRef.current?.parentElement;
    if (scroller) {
      scroller.scrollLeft = Math.max(0, (scroller.scrollWidth - scroller.clientWidth) / 2);
    }
  }, [svg]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(chart);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const downloadSvg = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(title ?? "reposketch-diagram").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="flex min-h-[34rem] items-center justify-center rounded-[12px] border border-red/25 bg-red-tint p-8 text-red">
        <div className="text-center">
          <Icon name="alert" size={28} className="mx-auto mb-3" />
          <p className="text-[13px] font-medium">{error}</p>
          <p className="mt-1 text-[11.5px] opacity-80">The Mermaid source is still available via Copy source.</p>
        </div>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex min-h-[34rem] items-center justify-center rounded-[12px] border border-line bg-surface">
        <div className="flex flex-col items-center text-ink-3">
          <Icon name="loader" size={24} className="animate-spin" />
          <p className="mt-3 text-[12px]">Rendering diagram...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={viewerRef} className="overflow-hidden rounded-[12px] border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-inset/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-[6px] bg-accent-tint text-accent-ink">
            <Icon name="network" size={13} />
          </span>
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3 sm:inline">
            Diagram stage
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="xs" variant="quiet" onClick={copyCode} title="Copy Mermaid source">
            <Icon name={copied ? "check" : "copy"} size={13} />
            <span className="hidden sm:inline">{copied ? "Copied" : "Source"}</span>
          </Button>
          <Button size="xs" variant="quiet" onClick={downloadSvg} title="Download SVG">
            <Icon name="external" size={13} />
            <span className="hidden sm:inline">SVG</span>
          </Button>
          <span className="mx-1 h-4 w-px bg-line" aria-hidden />
          <Button size="xs" variant="quiet" onClick={() => setFit((value) => !value)}>
            {fit ? "Natural" : "Fit"}
          </Button>
          <Button size="xs" variant="quiet" onClick={() => setZoom((value) => Math.max(0.6, Number((value - 0.15).toFixed(2))))} aria-label="Zoom out">
            −
          </Button>
          <span className="min-w-11 text-center font-mono text-[10.5px] text-ink-3">
            {Math.round(zoom * 100)}%
          </span>
          <Button size="xs" variant="quiet" onClick={() => setZoom((value) => Math.min(2.2, Number((value + 0.15).toFixed(2))))} aria-label="Zoom in">
            +
          </Button>
        </div>
      </div>

      <div className="scroll-area max-h-[70vh] overflow-auto p-3 md:p-5">
        <div ref={containerRef} className="w-max min-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    </div>
  );
}

function normalizeSvg(renderedSvg: string) {
  try {
    const parser = new DOMParser();
    const documentNode = parser.parseFromString(renderedSvg, "image/svg+xml");
    const svgNode = documentNode.querySelector("svg");
    if (!svgNode) return renderedSvg;

    svgNode.removeAttribute("width");
    svgNode.removeAttribute("height");
    svgNode.setAttribute("preserveAspectRatio", "xMinYMin meet");
    svgNode.setAttribute("class", "reposketch-mermaid-svg");
    return svgNode.outerHTML;
  } catch {
    return renderedSvg;
  }
}
