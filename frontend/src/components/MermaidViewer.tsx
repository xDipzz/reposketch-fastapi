import { useEffect, useId, useRef, useState } from "react";

type MermaidViewerProps = {
  chart: string;
  layoutMode?: "fit-width" | "natural";
};

export function MermaidViewer({ chart, layoutMode = "natural" }: MermaidViewerProps) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const elementId = useId();
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

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
          flowchart: {
            useMaxWidth: false,
            htmlLabels: true,
          },
        });

        const { svg: renderedSvg } = await mermaid.render(renderId, chart);
        if (!cancelled) {
          setSvg(normalizeRenderedSvg(renderedSvg));
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

  useEffect(() => {
    setZoom(1);
  }, [chart]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === viewerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const svgElement = containerRef.current?.querySelector("svg");
    if (!(svgElement instanceof SVGSVGElement)) {
      return;
    }

    const viewBox = svgElement.viewBox.baseVal;
    const baseWidth =
      viewBox?.width ||
      safeNumber(svgElement.getAttribute("width")) ||
      svgElement.getBoundingClientRect().width ||
      1200;
    const baseHeight =
      viewBox?.height ||
      safeNumber(svgElement.getAttribute("height")) ||
      svgElement.getBoundingClientRect().height ||
      720;
    const parentWidth = containerRef.current?.parentElement?.clientWidth ?? baseWidth;
    const fittedWidth = Math.max(parentWidth - 24, 320);
    const scaledWidth =
      layoutMode === "fit-width"
        ? fittedWidth * zoom
        : Math.max(baseWidth * zoom, fittedWidth);
    const scaledHeight =
      layoutMode === "fit-width"
        ? (baseHeight / Math.max(baseWidth, 1)) * scaledWidth
        : baseHeight * zoom;

    svgElement.style.width = `${Math.round(scaledWidth)}px`;
    svgElement.style.height = `${Math.round(scaledHeight)}px`;
    svgElement.style.maxWidth = "none";
    svgElement.style.display = "block";
  }, [svg, zoom, isFullscreen, layoutMode]);

  const toggleFullscreen = async () => {
    const viewer = viewerRef.current;
    if (!viewer) {
      return;
    }

    try {
      if (document.fullscreenElement === viewer) {
        await document.exitFullscreen();
        return;
      }
      await viewer.requestFullscreen();
    } catch {
      // Ignore browser-specific fullscreen errors and keep the viewer usable.
    }
  };

  if (error) {
    return (
      <div className="flex min-h-[34rem] items-center justify-center rounded-[28px] border border-red-200 bg-red-50 p-8 text-red-600">
        <div className="text-center">
          <svg className="mx-auto mb-3 h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex min-h-[34rem] items-center justify-center rounded-[28px] border border-slate-200 bg-slate-50/80 backdrop-blur-sm">
        <div className="flex flex-col items-center">
          <svg className="mb-4 h-8 w-8 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="font-medium text-gray-500">Rendering diagram...</p>
        </div>
      </div>
    );
  }

  const shellClasses = [
    "border border-slate-200 bg-slate-100/80 shadow-inner",
    isFullscreen
      ? "h-screen w-full overflow-auto rounded-none bg-slate-100"
      : layoutMode === "fit-width"
        ? "w-full min-w-0 rounded-[28px] overflow-visible"
        : "w-max min-w-full rounded-[28px] overflow-visible"
  ].join(" ");

  const canvasClasses =
    layoutMode === "fit-width"
      ? "w-full min-w-0 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:p-6 xl:p-8"
      : "w-max min-w-full rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:p-6 xl:p-8";

  const diagramClasses = layoutMode === "fit-width" ? "w-full min-w-0" : "w-max min-w-full";

  return (
    <div ref={viewerRef} className={shellClasses}>
      <div className={`flex items-center justify-end gap-2 border-b border-slate-200 bg-white/90 px-4 py-3 ${isFullscreen ? "sticky top-0 z-20 backdrop-blur" : ""}`}>
        <button
          className="btn-secondary px-3 py-1.5 text-xs"
          onClick={() => setZoom((current) => Math.max(0.7, Number((current - 0.15).toFixed(2))))}
          type="button"
        >
          -
        </button>
        <button className="btn-secondary min-w-[4.75rem] px-3 py-1.5 text-xs font-mono" onClick={() => setZoom(1)} type="button">
          {Math.round(zoom * 100)}%
        </button>
        <button
          className="btn-secondary px-3 py-1.5 text-xs"
          onClick={() => setZoom((current) => Math.min(2.2, Number((current + 0.15).toFixed(2))))}
          type="button"
        >
          +
        </button>
        <button className="btn-secondary px-3 py-1.5 text-xs" onClick={toggleFullscreen} type="button">
          {isFullscreen ? "Exit full screen" : "Full screen"}
        </button>
      </div>

      <div className={isFullscreen ? "overflow-auto px-4 py-4 md:px-6 xl:px-8" : "px-4 py-4 md:px-6 xl:px-8"}>
        <div className={canvasClasses}>
          <div ref={containerRef} className={diagramClasses} dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
      </div>
    </div>
  );
}

function normalizeRenderedSvg(renderedSvg: string) {
  try {
    const parser = new DOMParser();
    const documentNode = parser.parseFromString(renderedSvg, "image/svg+xml");
    const svgNode = documentNode.querySelector("svg");

    if (!svgNode) {
      return renderedSvg;
    }

    svgNode.removeAttribute("width");
    svgNode.removeAttribute("height");
    svgNode.setAttribute("preserveAspectRatio", "xMinYMin meet");
    svgNode.setAttribute(
      "class",
      [svgNode.getAttribute("class"), "mermaid-rendered-svg"].filter(Boolean).join(" "),
    );

    return svgNode.outerHTML;
  } catch {
    return renderedSvg;
  }
}

function safeNumber(value: string | null) {
  if (!value) {
    return 0;
  }

  const numericValue = Number.parseFloat(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}
