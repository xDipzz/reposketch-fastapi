import { useEffect, useMemo, useState } from "react";
import type { Diagram, RepoInsights, Summary } from "@/api/client";
import { Button } from "@/components/atoms/Button";
import { Chip } from "@/components/atoms/Chip";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Icon } from "@/components/icons/Icons";
import { MermaidViewer } from "@/components/MermaidViewer";
import type { WorkspaceView } from "@/components/AppSidebar";
import { cn } from "@/lib/utils";

export function ArchitectureWorkspace({
  summary,
  diagrams,
  loading,
  insights,
  insightsLoading,
  insightsError,
  dark,
  onGenerateInsights,
  onNavigate
}: {
  summary: Summary | null;
  diagrams: Diagram[];
  loading: boolean;
  insights: RepoInsights | null;
  insightsLoading: boolean;
  insightsError: string | null;
  dark: boolean;
  onGenerateInsights: () => void;
  onNavigate: (view: WorkspaceView) => void;
}) {
  const [activeId, setActiveId] = useState(diagrams[0]?.id ?? "");

  useEffect(() => {
    if (!diagrams.some((diagram) => diagram.id === activeId)) {
      setActiveId(diagrams[0]?.id ?? "");
    }
  }, [diagrams, activeId]);

  const active = useMemo(
    () => diagrams.find((diagram) => diagram.id === activeId) ?? diagrams[0],
    [diagrams, activeId]
  );

  if (!summary) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center rounded-[14px] border border-dashed border-line bg-surface/50 p-8 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-inset text-ink-3">
          <Icon name="network" size={20} />
        </span>
        <h2 className="mt-3 text-[15px] font-semibold text-ink">No repository loaded</h2>
        <p className="mt-1 max-w-sm text-[12.5px] leading-5 text-ink-3">
          Analyze a repository from the briefing workspace to generate architecture diagrams.
        </p>
        <Button className="mt-4" size="sm" variant="primary" onClick={() => onNavigate("briefing")}>
          <Icon name="arrow-left" size={14} />
          Go to briefing
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="panel p-4 md:p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="kicker">
                <span className="size-1.5 rounded-full bg-accent" />
                Architecture
              </span>
              <StatusPill tone="neutral" dot={false}>
                {summary.repo_name}
              </StatusPill>
              {loading ? <StatusPill tone="orange">Rendering</StatusPill> : null}
            </div>
            <h1 className="mt-2.5 text-2xl font-semibold tracking-[-0.03em] text-ink md:text-3xl">
              Repository map
            </h1>
            <p className="mt-1 max-w-2xl text-[12.5px] leading-5 text-ink-2">
              Three views generated from the parsed file tree, AST imports, and top-level module
              relationships. Pan, zoom, copy the Mermaid source, or export an SVG.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={onGenerateInsights} disabled={insightsLoading}>
              <Icon name={insightsLoading ? "loader" : "sparkles"} size={13} className={insightsLoading ? "animate-spin" : ""} />
              {insights ? "Refresh briefing" : "Generate briefing"}
            </Button>
            <Button size="sm" variant="primary" onClick={() => onNavigate("ask")}>
              <Icon name="chat" size={13} />
              Ask from this map
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MiniStat label="Files parsed" value={summary.file_count} />
          <MiniStat label="Modules" value={summary.major_modules.length} />
          <MiniStat label="Entry points" value={summary.entry_points.length} />
          <MiniStat label="Indexed files" value={summary.indexed_file_count} />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <section className="panel min-w-0 self-start overflow-hidden">
          <div className="flex flex-wrap items-center gap-1 border-b border-line px-2 py-2">
            {diagrams.map((diagram) => (
              <button
                key={diagram.id}
                type="button"
                onClick={() => setActiveId(diagram.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                  active?.id === diagram.id
                    ? "bg-ink text-canvas"
                    : "text-ink-2 hover:bg-hover hover:text-ink"
                )}
              >
                {diagram.title}
              </button>
            ))}
            {!diagrams.length && !loading ? (
              <span className="px-2 py-1.5 text-[12px] text-ink-3">No diagrams available.</span>
            ) : null}
          </div>
          <div className="p-3 md:p-4">
            {active ? (
              <>
                <p className="mb-3 text-[12px] leading-5 text-ink-2">{active.description}</p>
                <MermaidViewer chart={active.mermaid} dark={dark} title={active.title} />
              </>
            ) : (
              <div className="flex min-h-[34rem] items-center justify-center text-[12px] text-ink-3">
                {loading ? "Building diagrams..." : "Analyze a repository to build diagrams."}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="panel p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[13px] font-semibold text-ink">How to read this</h2>
              <Icon name="book" size={14} className="text-ink-3" />
            </div>
            <ul className="mt-3 space-y-2.5">
              {[
                ["Project structure", "Top-level folders and representative files."],
                ["File dependencies", "Internal Python imports resolved from the AST."],
                ["Module relationships", "Packages grouped into higher-level service boundaries."]
              ].map(([label, description]) => (
                <li key={label} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                  <span>
                    <strong className="block text-[11.5px] font-medium text-ink">{label}</strong>
                    <span className="text-[11px] leading-4 text-ink-3">{description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {insights ? (
            <section className="panel p-4">
              <div className="flex items-center gap-1.5">
                <Icon name="sparkles" size={13} className="text-accent-ink" />
                <h2 className="text-[13px] font-semibold text-ink">AI architecture note</h2>
              </div>
              <p className="mt-2 text-[11.5px] leading-5 text-ink-2">{insights.architecture}</p>
              <div className="mt-3 flex flex-wrap gap-1 border-t border-line pt-3">
                {insights.entry_points.slice(0, 4).map((item) => (
                  <Chip key={item} tone="accent">
                    {item}
                  </Chip>
                ))}
              </div>
            </section>
          ) : (
            <section className="panel p-4">
              <div className="flex items-center gap-1.5">
                <Icon name="sparkles" size={13} className="text-ink-3" />
                <h2 className="text-[13px] font-semibold text-ink">AI architecture note</h2>
              </div>
              <p className="mt-2 text-[11.5px] leading-5 text-ink-3">
                Generate a briefing to get plain-English notes about module boundaries and the
                best place to start reading.
              </p>
              {insightsError ? (
                <p className="mt-2 text-[11px] leading-4 text-red">{insightsError}</p>
              ) : null}
            </section>
          )}

          <section className="panel p-4">
            <h2 className="text-[13px] font-semibold text-ink">Detected folders</h2>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {summary.top_level_folders.length ? (
                summary.top_level_folders.slice(0, 12).map((folder) => (
                  <span
                    key={folder}
                    className="inline-flex items-center gap-1 rounded-[6px] border border-line bg-inset px-1.5 py-1 text-[10.5px] text-ink-2"
                  >
                    <Icon name="folder" size={10} className="text-ink-3" />
                    {folder}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-ink-3">No folders detected.</span>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[9px] border border-line bg-inset/60 px-3 py-2">
      <span className="stat-label">{label}</span>
      <strong className="mt-1 block font-mono text-[17px] font-semibold leading-none text-ink tabular-nums">
        {value.toLocaleString()}
      </strong>
    </div>
  );
}
