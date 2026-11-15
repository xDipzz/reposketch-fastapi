import type { RepoInsights } from "@/api/client";
import { Button } from "@/components/atoms/Button";
import { Shimmer } from "@/components/atoms/Shimmer";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Icon } from "@/components/icons/Icons";

export function InsightPanel({
  insights,
  loading,
  error,
  onGenerate,
  compact = false
}: {
  insights: RepoInsights | null;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
  compact?: boolean;
}) {
  return (
    <section className="panel overflow-hidden">
      <div className="panel-header">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-[7px] bg-accent-tint text-accent-ink">
            <Icon name="sparkles" size={14} />
          </span>
          <div>
            <h2 className="text-[13px] font-semibold text-ink">AI briefing</h2>
            <p className="text-[11px] text-ink-3">Generated from repository metadata by Gemini</p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          {insights ? (
            <StatusPill tone="accent" dot={false} className="hidden sm:inline-flex">
              {insights.model}
            </StatusPill>
          ) : null}
          <Button
            size="xs"
            variant="secondary"
            onClick={onGenerate}
            disabled={loading}
            title={insights ? "Regenerate briefing" : "Generate briefing"}
          >
            <Icon name={loading ? "loader" : "refresh"} size={13} className={loading ? "animate-spin" : ""} />
            {insights ? "Regenerate" : "Generate"}
          </Button>
        </div>
      </div>

      <div className={compact ? "p-4" : "p-5"}>
        {loading ? (
          <div className="space-y-3">
            <Shimmer className="text-[13px] font-medium">
              Reading the repository structure and drafting a briefing...
            </Shimmer>
            <div className="space-y-2 pt-1">
              <div className="h-2 w-full animate-pulse rounded-full bg-inset" />
              <div className="h-2 w-11/12 animate-pulse rounded-full bg-inset" />
              <div className="h-2 w-4/5 animate-pulse rounded-full bg-inset" />
            </div>
          </div>
        ) : error ? (
          <div className="flex gap-3 rounded-[10px] border border-red/25 bg-red-tint p-3 text-[12.5px] leading-5 text-red">
            <Icon name="alert" size={15} className="mt-0.5 shrink-0" />
            <div>
              <strong className="block font-semibold">Briefing unavailable</strong>
              <p className="mt-0.5">{error}</p>
              <button type="button" onClick={onGenerate} className="mt-1.5 font-semibold underline">
                Try again
              </button>
            </div>
          </div>
        ) : insights ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-3">
                  What it is
                </h3>
                <p className="mt-1.5 text-[13px] leading-6 text-ink">{insights.overview}</p>
              </div>
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-3">
                  Architecture
                </h3>
                <p className="mt-1.5 text-[13px] leading-6 text-ink-2">{insights.architecture}</p>
              </div>
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-3">
                  Where to start
                </h3>
                <p className="mt-1.5 text-[13px] leading-6 text-ink-2">{insights.onboarding}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-3">
                  Entry points
                </h3>
                <div className="flex flex-wrap gap-1">
                  {insights.entry_points.length ? (
                    insights.entry_points.map((item) => (
                      <span
                        key={item}
                        className="inline-flex max-w-full items-center gap-1 rounded-[6px] border border-line bg-inset px-1.5 py-1 font-mono text-[10.5px] text-ink-2"
                      >
                        <Icon name="file" size={10} className="shrink-0 text-ink-3" />
                        <span className="truncate">{item}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-[11.5px] text-ink-3">No clear entry point detected.</span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-3">
                  Risks & unknowns
                </h3>
                {insights.risks.length ? (
                  <ul className="space-y-1.5">
                    {insights.risks.map((risk) => (
                      <li key={risk} className="flex gap-1.5 text-[11.5px] leading-5 text-ink-2">
                        <span className="mt-2 size-1 shrink-0 rounded-full bg-orange" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11.5px] text-ink-3">No obvious risks surfaced.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-inset text-ink-2">
                <Icon name="sparkles" size={14} />
              </span>
              <p className="max-w-lg text-[12.5px] leading-5 text-ink-2">
                Generate a senior-engineer briefing with an overview, architecture notes,
                entry points, and risks. One free Gemini request, cached on the server.
              </p>
            </div>
            <Button size="sm" variant="primary" onClick={onGenerate} disabled={loading}>
              <Icon name="sparkles" size={13} />
              Generate briefing
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
