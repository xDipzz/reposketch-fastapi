export type WorkspaceView = "briefing" | "architecture" | "interrogate";

type WorkspaceNavProps = {
  activeView: WorkspaceView;
  indexStatus: "idle" | "indexing" | "ready" | "error";
  repoName: string | null;
  repoId: string | null;
  onChange: (view: WorkspaceView) => void;
};

const workspaces: Array<{
  id: WorkspaceView;
  label: string;
  blurb: string;
}> = [
  {
    id: "briefing",
    label: "Briefing",
    blurb: "Ingest and summary"
  },
  {
    id: "architecture",
    label: "Architecture",
    blurb: "Diagram workspace"
  },
  {
    id: "interrogate",
    label: "Interrogate",
    blurb: "Grounded Q&A"
  }
];

const indexLabels = {
  idle: "Awaiting index",
  indexing: "Indexing",
  ready: "Ask-ready",
  error: "Index blocked"
};

export function WorkspaceNav({
  activeView,
  indexStatus,
  repoName,
  repoId,
  onChange
}: WorkspaceNavProps) {
  return (
    <header className="topbar panel">
      <div className="brand-lockup">
        <div className="brand-mark">RS</div>
        <div>
          <p className="eyebrow">Repository intelligence</p>
          <h1 className="brand-title">RepoSketch</h1>
        </div>
      </div>

      <nav className="workspace-nav" aria-label="Workspace navigation">
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            className={workspace.id === activeView ? "workspace-pill active" : "workspace-pill"}
            onClick={() => onChange(workspace.id)}
            type="button"
          >
            <strong>{workspace.label}</strong>
            <span>{workspace.blurb}</span>
          </button>
        ))}
      </nav>

      <div className="topbar-status">
        <div className={`index-pill ${indexStatus}`}>
          <span className="index-pulse" />
          {indexLabels[indexStatus]}
        </div>
        <div className="repo-pill">
          <span className="mono-label">active repo</span>
          <strong>{repoName ?? "No repo loaded"}</strong>
          <span>{repoId ?? "load a GitHub URL to begin"}</span>
        </div>
      </div>
    </header>
  );
}
