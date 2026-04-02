import type { AskResponse, Summary } from "../api/client";
import { AskPanel } from "./AskPanel";
import type { WorkspaceView } from "./WorkspaceNav";

type InterrogateWorkspaceProps = {
  summary: Summary | null;
  response: AskResponse | null;
  loading: boolean;
  disabled: boolean;
  disabledReason: string | null;
  statusMessage: string | null;
  error: string | null;
  onAsk: (question: string) => void;
  onNavigate: (view: WorkspaceView) => void;
};

export function InterrogateWorkspace({
  summary,
  response,
  loading,
  disabled,
  disabledReason,
  statusMessage,
  error,
  onAsk,
  onNavigate
}: InterrogateWorkspaceProps) {
  return (
    <section className="workspace">
      <div className="workspace-grid interrogate-grid">
        <div className="workspace-main">
          <AskPanel
            response={response}
            loading={loading}
            disabled={disabled}
            disabledReason={disabledReason}
            statusMessage={statusMessage}
            error={error}
            onAsk={onAsk}
          />
        </div>

        <aside className="workspace-rail rail-stack">
          <section className="panel rail-card">
            <p className="eyebrow">Questioning mode</p>
            <h2 className="panel-title">Ask with intent</h2>
            <ul className="rail-list">
              <li>Ask about routing, startup flow, config ownership, and module boundaries.</li>
              <li>Prefer file-specific questions over broad “what is X?” prompts.</li>
              <li>Use the evidence rail to verify where the answer came from.</li>
            </ul>
          </section>

          <section className="panel rail-card">
            <p className="eyebrow">Repository cues</p>
            <h2 className="panel-title">{summary?.repo_name ?? "No repository loaded"}</h2>
            <ul className="rail-list compact">
              {summary?.major_modules.length ? (
                summary.major_modules.map((moduleName) => <li key={moduleName}>{moduleName}</li>)
              ) : (
                <li>Load and index a repository to unlock grounded Q&amp;A.</li>
              )}
            </ul>
          </section>

          <section className="panel rail-card">
            <p className="eyebrow">Switch context</p>
            <h2 className="panel-title">Other workspaces</h2>
            <div className="jump-grid">
              <button className="secondary-button" onClick={() => onNavigate("briefing")} type="button">
                View briefing
              </button>
              <button className="secondary-button" onClick={() => onNavigate("architecture")} type="button">
                View architecture
              </button>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
