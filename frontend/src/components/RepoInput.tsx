type RepoInputProps = {
  repoUrl: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function RepoInput({ repoUrl, loading, onChange, onSubmit }: RepoInputProps) {
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
          onChange={(event) => onChange(event.target.value)}
        />
        <button className="primary-button" disabled={loading || !repoUrl.trim()} onClick={onSubmit}>
          {loading ? "Analyzing..." : "Analyze repository"}
        </button>
      </div>
    </section>
  );
}
