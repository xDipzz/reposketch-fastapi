import type { Summary } from "../api/client";

type SummaryPanelProps = {
  summary: Summary | null;
  loading: boolean;
  warnings: string[];
  indexMessage: string | null;
  indexStatus: "idle" | "indexing" | "ready" | "error";
};

export function SummaryPanel({ summary, loading, warnings, indexMessage, indexStatus }: SummaryPanelProps) {
  const indexMessageClasses =
    indexStatus === "error"
      ? "bg-red-400/10 border-red-400/20 text-red-200"
      : indexStatus === "ready"
        ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-200"
        : indexStatus === "indexing"
          ? "bg-amber-400/10 border-amber-400/20 text-amber-200"
          : "bg-white/[0.055] border-white/10 text-slate-300";

  const indexMetricLabel = indexStatus === "ready" ? "Indexed" : "Indexable";

  const renderTokens = (items: string[], empty: string, limit = 8) => {
    if (!items.length) {
      return <div className="py-2 text-sm italic text-slate-600">{empty}</div>;
    }

    const visible = items.slice(0, limit);
    const remainder = items.length - visible.length;

    return (
      <div className="flex flex-wrap gap-2">
        {visible.map((item) => (
          <span key={item} className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 font-mono text-xs font-medium text-slate-300">
            {item}
          </span>
        ))}
        {remainder > 0 ? (
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs font-semibold text-slate-500">
            +{remainder} more
          </span>
        ) : null}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="premium-panel flex h-72 flex-col justify-center p-8">
        <div className="mb-5 h-2 w-24 rounded-full bg-white signal-pulse" />
        <div className="space-y-3">
          <div className="h-4 w-2/3 rounded-full bg-white/10" />
          <div className="h-4 w-1/2 rounded-full bg-white/10" />
          <div className="h-20 rounded-2xl border border-white/10 bg-white/[0.045]" />
        </div>
        <div className="mt-5 text-sm font-semibold text-slate-500">Scanning folders, symbols, and entry points...</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="premium-panel flex h-64 flex-col items-center justify-center p-8 text-center">
        <div className="text-sm font-semibold text-slate-500">No repository data available</div>
      </div>
    );
  }

  const metrics = [
    { label: "Files", value: summary.file_count },
    { label: "Classes", value: summary.total_classes },
    { label: "Functions", value: summary.total_functions },
    { label: indexMetricLabel, value: summary.indexed_file_count }
  ];

  return (
    <div className="space-y-5">
      <section className="premium-panel relative overflow-hidden p-6 md:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/20" />
        <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Repository Briefing</p>
            <h2 className="text-4xl font-extrabold tracking-normal text-white">{summary.repo_name}</h2>
            <p className="mt-2 max-w-3xl truncate font-mono text-sm text-slate-500">{summary.repo_url}</p>
          </div>
          <div className="flex h-min flex-wrap items-start gap-2">
            <span className="badge badge-blue">
              {summary.detected_framework ?? "Framework pending"}
            </span>
            <span className="badge badge-gray font-mono">
              {summary.repo_id}
            </span>
          </div>
        </div>

        {indexMessage && (
          <div className={`mb-5 rounded-lg border p-4 text-sm font-semibold ${indexMessageClasses}`}>
            {indexMessage}
          </div>
        )}
        
        {warnings.length > 0 && (
          <div className="mb-5 space-y-2">
            {warnings.map((warning) => (
              <div key={warning} className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm font-medium text-amber-200">
                {warning}
              </div>
            ))}
          </div>
        )}

        <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-4">
          {metrics.map((metric, index) => (
            <div key={metric.label} className={`bg-black/45 p-4 ${index === metrics.length - 1 ? "text-white" : "text-slate-100"}`}>
              <div className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{metric.label}</div>
              <div className="font-mono text-3xl font-semibold">{metric.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-7 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Major Modules</h3>
            {renderTokens(summary.major_modules, "Pending deeper analysis")}
          </div>

          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Entry Points</h3>
            {renderTokens(summary.entry_points, "Pending deeper analysis")}
          </div>

          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Important Files</h3>
            {renderTokens(summary.important_files, "No standout files detected yet")}
          </div>

          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Languages</h3>
            {Object.entries(summary.languages).length ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(summary.languages).map(([language, count]) => (
                  <span key={language} className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs font-semibold text-slate-300">
                    {language} <span className="ml-2 text-slate-500">({count})</span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="py-2 text-sm italic text-slate-600">No language breakdown available</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
