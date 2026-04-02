import type { Summary } from "../api/client";

type SummaryPanelProps = {
  summary: Summary | null;
  loading: boolean;
  warnings: string[];
  indexMessage: string | null;
};

export function SummaryPanel({ summary, loading, warnings, indexMessage }: SummaryPanelProps) {
  const renderTokens = (items: string[], empty: string, limit = 8) => {
    if (!items.length) {
      return <li>{empty}</li>;
    }

    const visible = items.slice(0, limit);
    const remainder = items.length - visible.length;

    return (
      <>
        {visible.map((item) => (
          <li key={item}>{item}</li>
        ))}
        {remainder > 0 ? <li>+{remainder} more</li> : null}
      </>
    );
  };

  if (loading) {
    return (
      <section className="panel summary-panel">
        <p className="eyebrow">Repository summary</p>
        <div className="placeholder-card">Scanning folders, symbols, and likely entry points...</div>
      </section>
    );
  }

  if (!summary) {
    return (
      <section className="panel summary-panel">
        <p className="eyebrow">Repository summary</p>
        <div className="placeholder-card">
          Load a repository to see framework detection, major modules, and important files.
        </div>
      </section>
    );
  }

  return (
    <section className="panel summary-panel">
      <div className="summary-header">
        <div className="summary-identity">
          <p className="eyebrow">Repository summary</p>
          <h2 className="panel-title">{summary.repo_name}</h2>
          <p className="summary-url">{summary.repo_url}</p>
        </div>
        <div className="summary-badges">
          <div className="badge">{summary.detected_framework ?? "Framework pending"}</div>
          <div className="badge muted">{summary.repo_id}</div>
        </div>
      </div>

      {indexMessage ? <div className="status-banner subtle">{indexMessage}</div> : null}
      {warnings.length ? (
        <div className="warning-stack">
          {warnings.map((warning) => (
            <div key={warning} className="warning-card">
              {warning}
            </div>
          ))}
        </div>
      ) : null}

      <div className="meta-strip">
        <div className="meta-card">
          <span>Loaded</span>
          <strong>{new Date(summary.loaded_at).toLocaleString()}</strong>
        </div>
        <div className="meta-card">
          <span>Top-level folders</span>
          <strong>{summary.top_level_folders.length}</strong>
        </div>
        <div className="meta-card">
          <span>Framework</span>
          <strong>{summary.detected_framework ?? "Unknown"}</strong>
        </div>
      </div>

      <div className="stats-grid summary-stats">
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
        <div className="summary-section">
          <h3>Major modules</h3>
          <ul className="chip-list">{renderTokens(summary.major_modules, "Pending deeper analysis")}</ul>
        </div>

        <div className="summary-section">
          <h3>Entry points</h3>
          <ul className="chip-list">{renderTokens(summary.entry_points, "Pending deeper analysis")}</ul>
        </div>

        <div className="summary-section">
          <h3>Important files</h3>
          <ul className="chip-list">
            {renderTokens(summary.important_files, "No standout files detected yet")}
          </ul>
        </div>

        <div className="summary-section">
          <h3>Languages</h3>
          <ul className="chip-list">
            {Object.entries(summary.languages).length ? (
              Object.entries(summary.languages).map(([language, count]) => (
                <li key={language}>
                  {language} ({count})
                </li>
              ))
            ) : (
              <li>No language breakdown available</li>
            )}
          </ul>
        </div>

        <div className="summary-section">
          <h3>Top-level folders</h3>
          <ul className="chip-list">{renderTokens(summary.top_level_folders, "No top-level folders detected")}</ul>
        </div>
      </div>
    </section>
  );
}
