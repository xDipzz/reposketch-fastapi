import type { RepoInsights, Summary } from "@/api/client";
import { Button } from "@/components/atoms/Button";
import { Chip } from "@/components/atoms/Chip";
import { ProgressRing } from "@/components/atoms/ProgressRing";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Icon } from "@/components/icons/Icons";
import { InsightPanel } from "@/components/InsightPanel";
import { RepoInput } from "@/components/RepoInput";
import TaskRows from "@/components/primitives/TaskRows";
import type { WorkspaceView } from "@/components/AppSidebar";
import { cn } from "@/lib/utils";

export type IndexState = {
  status: "idle" | "indexing" | "ready" | "error";
  message: string;
  provider?: string;
  chunks?: number;
};

type BriefingWorkspaceProps = {
  summary: Summary | null;
  loading: boolean;
  statusText: string | null;
  warnings: string[];
  indexState: IndexState;
  insights: RepoInsights | null;
  insightsLoading: boolean;
  insightsError: string | null;
  error: string | null;
  creditsRemaining: number | null;
  onAnalyze: (url: string) => void;
  onGenerateInsights: () => void;
  onNavigate: (view: WorkspaceView) => void;
};

export function BriefingWorkspace({
  summary,
  loading,
  statusText,
  warnings,
  indexState,
  insights,
  insightsLoading,
  insightsError,
  error,
  creditsRemaining,
  onAnalyze,
  onGenerateInsights,
  onNavigate
}: BriefingWorkspaceProps) {
  if (!summary) {
    return (
      <div className="space-y-4">
        {error ? (
          <div className="flex items-start gap-2.5 rounded-[12px] border border-red/25 bg-red-tint p-3.5 text-[12.5px] leading-5 text-red">
            <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
            <div>
              <strong className="block font-semibold">Analysis failed</strong>
              <p>{error}</p>
            </div>
          </div>
        ) : null}
        <RepoInput
          loading={loading}
          statusText={statusText}
          indexStatus={indexState.status}
          creditsRemaining={creditsRemaining}
          onAnalyze={onAnalyze}
        />
      </div>
    );
  }

  const taskRows = [
    {
      key: "clone",
      label: "Clone + parse repository",
      amount: `${summary.file_count} files`,
      status: "done" as const,
      details: [
        { label: "Framework", meta: summary.detected_framework ?? "not detected" },
        { label: "Classes / functions", meta: `${summary.total_classes} / ${summary.total_functions}` }
      ]
    },
    {
      key: "index",
      label: "Build grounded retrieval index",
      amount: indexState.chunks ? `${indexState.chunks} chunks` : indexState.status,
      status: indexState.status === "ready" ? ("done" as const) : ("running" as const),
      step: 2,
      details: [
        { label: "Index", meta: indexState.provider ?? "local" },
        { label: "Status", meta: indexState.message }
      ]
    },
    {
      key: "briefing",
      label: "Draft AI architecture briefing",
      amount: insights ? "cached" : insightsLoading ? "running" : "not generated",
      status: insights ? ("done" as const) : insightsLoading ? ("running" as const) : ("pending" as const),
      step: 3,
      details: [
        { label: "Briefing", meta: insights ? "cached" : "not generated" },
        { label: "Suggested questions", meta: String(insights?.suggested_questions.length ?? 0) }
      ]
    }
  ];

  return (
    <div className="space-y-4">
      {error ? (
        <div className="flex items-start gap-2.5 rounded-[12px] border border-red/25 bg-red-tint p-3.5 text-[12.5px] leading-5 text-red">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          <div>
            <strong className="block font-semibold">Request failed</strong>
            <p>{error}</p>
          </div>
        </div>
      ) : null}

      <section className="hero-surface p-5 md:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="kicker">
                <span className="size-1.5 rounded-full bg-green" />
                Briefing
              </span>
              {summary.detected_framework ? (
                <StatusPill tone="accent" dot={false}>
                  {summary.detected_framework}
                </StatusPill>
              ) : null}
              <StatusPill
                tone={indexState.status === "ready" ? "green" : indexState.status === "error" ? "red" : "neutral"}
              >
                {indexState.status === "ready" ? "Grounded Q&A ready" : indexState.status}
              </StatusPill>
            </div>
            <h1 className="mt-3 truncate text-3xl font-semibold tracking-[-0.03em] text-ink md:text-4xl">
              {summary.repo_name}
            </h1>
            <a
              href={summary.repo_url}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex max-w-full items-center gap-1 font-mono text-[11.5px] text-ink-3 transition-colors hover:text-accent-ink"
            >
              <span className="truncate">{summary.repo_url}</span>
              <Icon name="arrow-up-right" size={11} className="shrink-0" />
            </a>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button size="sm" variant="primary" onClick={() => onNavigate("architecture")}>
              <Icon name="network" size={14} />
              View map
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onNavigate("ask")}
              disabled={indexState.status !== "ready"}
            >
              <Icon name="chat" size={14} />
              Ask repo
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Files" value={summary.file_count} icon="file" />
          <Stat label="Modules" value={summary.major_modules.length} icon="layers" />
          <Stat label="Classes" value={summary.total_classes} icon="code" />
          <Stat label="Functions" value={summary.total_functions} icon="terminal" />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          <InsightPanel
            insights={insights}
            loading={insightsLoading}
            error={insightsError}
            onGenerate={onGenerateInsights}
          />
          <SummaryCard summary={summary} warnings={warnings} />
        </div>

        <div className="min-w-0 space-y-4">
          <section className="panel p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[13px] font-semibold text-ink">Pipeline</h2>
                <p className="mt-0.5 text-[11px] text-ink-3">What RepoSketch has built for this repo.</p>
              </div>
              <ProgressRing
                progress={indexState.status === "ready" ? 1 : indexState.status === "indexing" ? 0.55 : 0.28}
                tone={indexState.status === "error" ? "red" : indexState.status === "ready" ? "green" : "accent"}
                size={32}
              >
                {indexState.status === "ready" ? "100" : indexState.status === "indexing" ? "55" : "28"}
              </ProgressRing>
            </div>
            <div className="mt-3">
              <TaskRows rows={taskRows} variant="List" labels={{ completed: "Done", failed: "Failed" }} />
            </div>
            <p className="mt-3 border-t border-line pt-3 text-[11px] leading-5 text-ink-3">
              {indexState.message}
            </p>
          </section>

          <section className="panel p-4">
            <h2 className="text-[13px] font-semibold text-ink">Language mix</h2>
            <div className="mt-3 space-y-2.5">
              {Object.entries(summary.languages)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([language, count]) => {
                  const max = Math.max(...Object.values(summary.languages), 1);
                  return (
                    <div key={language}>
                      <div className="flex items-center justify-between gap-2 text-[11.5px]">
                        <span className="font-medium text-ink-2">{language}</span>
                        <span className="font-mono text-[10.5px] text-ink-3">{count}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-inset">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${Math.max(4, (count / max) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon
}: {
  label: string;
  value: number;
  icon: "file" | "layers" | "code" | "terminal";
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between gap-2">
        <span className="stat-label">{label}</span>
        <Icon name={icon} size={13} className="text-ink-3" />
      </div>
      <div className="stat-value">{value.toLocaleString()}</div>
    </div>
  );
}

function SummaryCard({ summary, warnings }: { summary: Summary; warnings: string[] }) {
  const sections = [
    { title: "Top-level folders", items: summary.top_level_folders, icon: "folder" as const },
    { title: "Major modules", items: summary.major_modules, icon: "layers" as const },
    { title: "Entry points", items: summary.entry_points, icon: "bolt" as const },
    { title: "Important files", items: summary.important_files, icon: "file" as const }
  ];

  return (
    <section className="panel p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-semibold text-ink">Repository map</h2>
        <Chip>{summary.file_count} files</Chip>
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">
              <Icon name={section.icon} size={11} />
              {section.title}
            </h3>
            <div className="flex flex-wrap gap-1">
              {section.items.length ? (
                section.items.slice(0, 8).map((item) => (
                  <span
                    key={item}
                    className={cn(
                      "max-w-full truncate rounded-[6px] border border-line bg-inset px-1.5 py-1",
                      section.title === "Entry points"
                        ? "font-mono text-[10px] text-accent-ink"
                        : "text-[11px] text-ink-2"
                    )}
                    title={item}
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-ink-3">Not detected</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {warnings.length ? (
        <div className="mt-4 rounded-[9px] border border-orange/25 bg-orange-tint p-2.5">
          <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-orange">
            <Icon name="alert" size={11} />
            {warnings.length} warning{warnings.length === 1 ? "" : "s"}
          </p>
          <ul className="mt-1 space-y-1">
            {warnings.slice(0, 3).map((warning) => (
              <li key={warning} className="text-[11px] leading-5 text-orange">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
