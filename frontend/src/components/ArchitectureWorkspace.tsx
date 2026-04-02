import type { Diagram, Summary } from "../api/client";
import { DiagramTabs } from "./DiagramTabs";
import type { WorkspaceView } from "./WorkspaceNav";

type ArchitectureWorkspaceProps = {
  summary: Summary | null;
  diagrams: Diagram[];
  loading: boolean;
  onNavigate: (view: WorkspaceView) => void;
};

export function ArchitectureWorkspace({
  summary,
  diagrams,
  loading,
  onNavigate
}: ArchitectureWorkspaceProps) {
  return (
    <section className="workspace">
      <div className="workspace-grid architecture-grid">
        <div className="workspace-main">
          <section className="panel workspace-intro">
            <p className="eyebrow">Architecture mode</p>
            <h2 className="panel-title">Repository map</h2>
            <p className="panel-copy">
              Use this workspace when you want the repo as a visual system instead of a text report.
              Each view comes directly from extracted structure and import relationships.
            </p>
          </section>

          <DiagramTabs diagrams={diagrams} loading={loading} />
        </div>

        <aside className="workspace-rail rail-stack">
          <section className="panel rail-card">
            <p className="eyebrow">Snapshot</p>
            <h2 className="panel-title">{summary?.repo_name ?? "No repository loaded"}</h2>
            <div className="fact-grid">
              <div className="fact-card">
                <span>Framework</span>
                <strong>{summary?.detected_framework ?? "Unknown"}</strong>
              </div>
              <div className="fact-card">
                <span>Files</span>
                <strong>{summary?.file_count ?? 0}</strong>
              </div>
              <div className="fact-card">
                <span>Indexed</span>
                <strong>{summary?.indexed_file_count ?? 0}</strong>
              </div>
              <div className="fact-card">
                <span>Modules</span>
                <strong>{summary?.major_modules.length ?? 0}</strong>
              </div>
            </div>
          </section>

          <section className="panel rail-card">
            <p className="eyebrow">Hotspots</p>
            <h2 className="panel-title">Entry points</h2>
            <ul className="rail-list compact">
              {(summary?.entry_points.length ? summary.entry_points : ["No entry points detected"]).map(
                (item) => (
                  <li key={item}>{item}</li>
                )
              )}
            </ul>
          </section>

          <section className="panel rail-card">
            <p className="eyebrow">Next move</p>
            <h2 className="panel-title">Continue the session</h2>
            <div className="jump-grid">
              <button className="secondary-button" onClick={() => onNavigate("briefing")} type="button">
                Back to briefing
              </button>
              <button className="secondary-button" onClick={() => onNavigate("interrogate")} type="button">
                Ask about this map
              </button>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
