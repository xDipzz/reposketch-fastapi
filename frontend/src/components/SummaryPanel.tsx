import type { Summary } from "../api/client";

type SummaryPanelProps = {
  summary: Summary | null;
  loading: boolean;
};

export function SummaryPanel({ summary, loading }: SummaryPanelProps) {
  if (loading) {
    return (
      <section className="panel">
        <p className="eyebrow">Repository summary</p>
        <div className="placeholder-card">Scanning folders, symbols, and likely entry points...</div>
      </section>
    );
  }

  if (!summary) {
    return (
      <section className="panel">
        <p className="eyebrow">Repository summary</p>
        <div className="placeholder-card">
          Load a repository to see framework detection, major modules, and important files.
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Repository summary</p>
          <h2 className="panel-title">{summary.repo_name}</h2>
        </div>
        <div className="badge">{summary.detected_framework ?? "Framework pending"}</div>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span>Files</span>
          <strong>{summary.file_count}</strong>
        </article>
        <article className="stat-card">
          <span>Classes</span>
          <strong>{summary.total_classes}</strong>
        </article>
        <article className="stat-card">
          <span>Functions</span>
          <strong>{summary.total_functions}</strong>
        </article>
        <article className="stat-card">
          <span>Indexed</span>
          <strong>{summary.indexed_file_count}</strong>
        </article>
      </div>

      <div className="summary-grid">
        <div>
          <h3>Major modules</h3>
          <ul className="chip-list">
            {summary.major_modules.length ? (
              summary.major_modules.map((item) => <li key={item}>{item}</li>)
            ) : (
              <li>Pending deeper analysis</li>
            )}
          </ul>
        </div>

        <div>
          <h3>Entry points</h3>
          <ul className="chip-list">
            {summary.entry_points.length ? (
              summary.entry_points.map((item) => <li key={item}>{item}</li>)
            ) : (
              <li>Pending deeper analysis</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
