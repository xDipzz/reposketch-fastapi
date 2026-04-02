type RepoInputProps = {
  repoUrl: string;
  loading: boolean;
  statusText: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

const sampleRepos = [
  "https://github.com/pallets/click",
  "https://github.com/tiangolo/fastapi",
  "https://github.com/pydantic/pydantic"
];

export function RepoInput({ repoUrl, loading, statusText, onChange, onSubmit }: RepoInputProps) {
  return (
    <section className="panel panel-hero">
      <div className="space-y-3">
        <p className="eyebrow">Repository ingest</p>
        <div>
          <h1 className="hero-title">Paste a repo. Understand everything.</h1>
          <p className="hero-copy">
            RepoSketch turns a Python-heavy repository into a structural summary, architecture
            diagrams, and grounded Q&amp;A.
          </p>
        </div>
      </div>

      <div className="repo-input-row">
        <input
          className="repo-input"
          placeholder="https://github.com/owner/project"
          value={repoUrl}
          disabled={loading}
          onChange={(event) => onChange(event.target.value)}
        />
        <button className="primary-button" disabled={loading || !repoUrl.trim()} onClick={onSubmit}>
          {loading ? "Working..." : "Analyze repository"}
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <p className="mini-label">Try a public repository</p>
          <div className="sample-list">
            {sampleRepos.map((item) => (
              <button key={item} className="sample-chip" onClick={() => onChange(item)}>
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
