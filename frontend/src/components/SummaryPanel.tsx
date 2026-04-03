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
      ? "bg-red-50 border-red-100 text-red-800"
      : indexStatus === "ready"
        ? "bg-emerald-50 border-emerald-100 text-emerald-800"
        : indexStatus === "indexing"
          ? "bg-amber-50 border-amber-100 text-amber-800"
          : "bg-blue-50 border-blue-100 text-blue-800";

  const indexMetricLabel = indexStatus === "ready" ? "Indexed" : "Indexable";

  const renderTokens = (items: string[], empty: string, limit = 8) => {
    if (!items.length) {
      return <li className="text-gray-500 italic text-sm py-2">{empty}</li>;
    }

    const visible = items.slice(0, limit);
    const remainder = items.length - visible.length;

    return (
      <div className="flex flex-wrap gap-2">
        {visible.map((item) => (
          <span key={item} className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700">
            {item}
          </span>
        ))}
        {remainder > 0 ? (
          <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-50 border border-gray-200 text-sm font-medium text-gray-500">
            +{remainder} more
          </span>
        ) : null}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card p-8 flex flex-col items-center justify-center text-center space-y-4 h-64 border-dashed border-2 bg-gray-50/50">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div className="text-gray-500 font-medium">Scanning folders, symbols, and entry points...</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="card p-8 flex flex-col items-center justify-center text-center space-y-2 h-64 border-dashed border-2 bg-gray-50/50">
        <div className="text-gray-500 font-medium">No repository data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Repository Overview</p>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{summary.repo_name}</h2>
            <p className="text-sm text-gray-500 mt-1 font-mono">{summary.repo_url}</p>
          </div>
          <div className="flex flex-wrap gap-2 items-start h-min">
            <span className="badge badge-blue text-sm px-3 py-1 shadow-sm">
              {summary.detected_framework ?? "Framework pending"}
            </span>
            <span className="badge badge-gray text-xs font-mono px-3 py-1 shadow-sm border border-gray-200 bg-white">
              {summary.repo_id}
            </span>
          </div>
        </div>

        {indexMessage && (
          <div className={`mb-6 rounded-xl border p-4 text-sm font-medium ${indexMessageClasses}`}>
            {indexMessage}
          </div>
        )}
        
        {warnings.length > 0 && (
          <div className="mb-6 space-y-2">
            {warnings.map((warning) => (
              <div key={warning} className="p-3 rounded-lg bg-orange-50 border border-orange-100 text-orange-800 text-sm">
                {warning}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Files</div>
            <div className="text-2xl font-bold text-gray-900">{summary.file_count}</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="text-sm font-medium text-gray-500 mb-1">Classes</div>
            <div className="text-2xl font-bold text-gray-900">{summary.total_classes}</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="text-sm font-medium text-gray-500 mb-1">Functions</div>
            <div className="text-2xl font-bold text-gray-900">{summary.total_functions}</div>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
            <div className="text-sm font-medium text-blue-600 mb-1">{indexMetricLabel}</div>
            <div className="text-2xl font-bold text-blue-900">{summary.indexed_file_count}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Major Modules</h3>
            {renderTokens(summary.major_modules, "Pending deeper analysis")}
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Entry Points</h3>
            {renderTokens(summary.entry_points, "Pending deeper analysis")}
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Important Files</h3>
            {renderTokens(summary.important_files, "No standout files detected yet")}
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Languages</h3>
            {Object.entries(summary.languages).length ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(summary.languages).map(([language, count]) => (
                  <span key={language} className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700">
                    {language} <span className="ml-2 text-gray-400">({count})</span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 italic text-sm py-2">No language breakdown available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
