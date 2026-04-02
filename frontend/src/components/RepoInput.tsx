import type { FormEvent } from "react";

type RepoInputProps = {
  repoUrl: string;
  loading: boolean;
  statusText: string | null;
  repoName: string | null;
  indexStatus: "idle" | "indexing" | "ready" | "error";
  onChange: (value: string) => void;
  onSubmit: () => void;
};

const sampleRepos = [
  "https://github.com/pallets/click",
  "https://github.com/tiangolo/fastapi",
  "https://github.com/pydantic/pydantic"
];

const capabilityCards = [
  {
    label: "AST parser",
    value: "Python-native structure"
  },
  {
    label: "Mermaid",
    value: "Architecture snapshots"
  },
  {
    label: "Grounded RAG",
    value: "Source-backed answers"
  }
];

const statusLabels = {
  idle: "ready to analyze",
  indexing: "building vector index",
  ready: "analysis and Q&A online",
  error: "analysis loaded, indexing blocked"
};

export function RepoInput({
  repoUrl,
  loading,
  statusText,
  repoName,
  indexStatus,
  onChange,
  onSubmit
}: RepoInputProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <section className="panel hero-panel">
      <div className="hero-grid">
        <div className="hero-copy-block">
          <p className="eyebrow">Repository ingest</p>
          <h1 className="hero-title">Paste a repo. Understand everything.</h1>
          <p className="hero-copy">
            RepoSketch turns a Python-heavy repository into a navigable project briefing, a
            diagram-first architecture map, and a grounded question workspace with source evidence.
          </p>
        </div>

        <div className="hero-capabilities">
          {capabilityCards.map((card) => (
            <article key={card.label} className="capability-card">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          ))}
          <div className="capability-card capability-card-accent">
            <span>Current target</span>
            <strong>{repoName ?? "Awaiting repository"}</strong>
            <p>{statusLabels[indexStatus]}</p>
          </div>
        </div>
      </div>

      <form className="hero-form" onSubmit={handleSubmit}>
        <div className="repo-input-row">
          <input
            className="repo-input"
            placeholder="https://github.com/owner/project"
            value={repoUrl}
            disabled={loading}
            onChange={(event) => onChange(event.target.value)}
          />
          <button className="primary-button" disabled={loading || !repoUrl.trim()} type="submit">
            {loading ? "Analyzing..." : "Analyze repository"}
          </button>
        </div>
      </form>

      <div className="hero-footer">
        <div>
          <p className="mini-label">Try a public repository</p>
          <div className="sample-list">
            {sampleRepos.map((item) => (
              <button
                key={item}
                className="sample-chip"
                onClick={() => onChange(item)}
                type="button"
              >
                {item.replace("https://github.com/", "")}
              </button>
            ))}
          </div>
        </div>

        {statusText ? <div className="status-banner">{statusText}</div> : null}
      </div>
    </section>
  );
}
