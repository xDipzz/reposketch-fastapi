import type { Summary } from "../api/client";
import { RepoInput } from "./RepoInput";
import { SummaryPanel } from "./SummaryPanel";
import type { WorkspaceView } from "./WorkspaceNav";

type OverviewWorkspaceProps = {
  repoUrl: string;
  loading: boolean;
  statusText: string | null;
  repoName: string | null;
  summary: Summary | null;
  warnings: string[];
  indexMessage: string | null;
  indexStatus: "idle" | "indexing" | "ready" | "error";
  onChangeRepoUrl: (value: string) => void;
  onAnalyze: () => void;
  onNavigate: (view: WorkspaceView) => void;
};

const suggestedPrompts = [
  "Which file handles API routing?",
  "What are the main modules?",
  "Where is configuration defined?",
  "What happens at startup?"
];

export function OverviewWorkspace({
  repoUrl,
  loading,
  statusText,
  repoName,
  summary,
  warnings,
  indexMessage,
  indexStatus,
  onChangeRepoUrl,
  onAnalyze,
  onNavigate
}: OverviewWorkspaceProps) {
  const pipeline = [
    {
      label: "Clone",
      note: "Fetch the repository into local storage.",
      state: summary || loading ? "done" : "idle"
    },
    {
      label: "Parse",
      note: "Extract Python symbols, imports, and entry points.",
      state: summary ? "done" : loading ? "active" : "idle"
    },
    {
      label: "Diagram",
      note: "Generate project, dependency, and module views.",
      state: summary ? "done" : loading ? "active" : "idle"
    },
    {
      label: "Index",
      note: "Chunk repository files into the retrieval store.",
      state:
        indexStatus === "ready"
          ? "done"
          : indexStatus === "indexing"
            ? "active"
            : indexStatus === "error"
              ? "error"
              : "idle"
    }
  ];

  return (
    <section className="workspace">
      <div className="workspace-grid overview-grid">
        <div className="workspace-main">
          <RepoInput
            repoUrl={repoUrl}
            loading={loading}
            statusText={statusText}
            repoName={repoName}
            indexStatus={indexStatus}
            onChange={onChangeRepoUrl}
            onSubmit={onAnalyze}
          />

          <SummaryPanel
            summary={summary}
            loading={loading}
            warnings={warnings}
            indexMessage={indexMessage}
          />
        </div>

        <aside className="workspace-rail rail-stack">
          <section className="panel rail-card">
            <p className="eyebrow">Analysis pipeline</p>
            <h2 className="panel-title">What RepoSketch is doing</h2>
            <div className="timeline-list">
              {pipeline.map((item) => (
                <div key={item.label} className={`timeline-item ${item.state}`}>
                  <div className="timeline-marker" />
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel rail-card">
            <p className="eyebrow">Workspaces</p>
            <h2 className="panel-title">Move through the repo</h2>
            <div className="jump-grid">
              <button className="secondary-button" onClick={() => onNavigate("architecture")} type="button">
                Open architecture map
              </button>
              <button className="secondary-button" onClick={() => onNavigate("interrogate")} type="button">
                Open Q&amp;A workspace
              </button>
            </div>
            <p className="panel-copy">
              The app now behaves like a small analysis suite: briefing for intake, architecture for
              diagrams, interrogate for evidence-backed answers.
            </p>
          </section>

          <section className="panel rail-card">
            <p className="eyebrow">Suggested prompts</p>
            <h2 className="panel-title">Good first questions</h2>
            <ul className="rail-list">
              {suggestedPrompts.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </section>
  );
}
