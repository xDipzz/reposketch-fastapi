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
  if (!summary && !loading) {
    return (
      <div className="mx-auto flex w-full max-w-7xl items-center">
        <RepoInput
          repoUrl={repoUrl}
          loading={loading}
          statusText={statusText}
          repoName={repoName}
          indexStatus={indexStatus}
          onChange={onChangeRepoUrl}
          onSubmit={onAnalyze}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 animate-fade-up">
        <SummaryPanel
          summary={summary}
          loading={loading}
          warnings={warnings}
          indexMessage={indexMessage}
          indexStatus={indexStatus}
        />
      </div>
      <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-auto">
        <div className="premium-panel p-5 animate-fade-up-delay">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Workspace</h3>
              <p className="mt-1 text-xs text-slate-500">Move through the active analysis.</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {indexStatus}
            </span>
          </div>
          <div className="space-y-2">
            <button 
              className="group w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08]"
              onClick={() => onNavigate("architecture")}
              type="button"
            >
              <strong className="block text-sm font-semibold text-white">Architecture Map</strong>
              <span className="mt-1 block text-xs leading-5 text-slate-500">Generated Mermaid diagrams and import relationships.</span>
            </button>
            <button 
              className="group w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08]"
              onClick={() => onNavigate("interrogate")}
              type="button"
            >
              <strong className="block text-sm font-semibold text-white">Ask Repository</strong>
              <span className="mt-1 block text-xs leading-5 text-slate-500">Grounded answers with files and retrieved chunks.</span>
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 text-sm text-slate-500 shadow-sm backdrop-blur">
          <p className="font-semibold text-white">Index status</p>
          <p className="mt-2 leading-6">{indexMessage ?? "Indexing starts after a repository is analyzed."}</p>
        </div>
      </aside>
    </div>
  );
}
