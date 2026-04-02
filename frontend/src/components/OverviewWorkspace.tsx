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

  // If we haven't loaded a summary yet, show the hero RepoInput
  if (!summary && !loading) {
    return (
      <div className="max-w-4xl mx-auto mt-12">
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

  // Once loading or loaded, show the Summary Panel
  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
      <div className="flex-1">
        <SummaryPanel
          summary={summary}
          loading={loading}
          warnings={warnings}
          indexMessage={indexMessage}
        />
      </div>
      <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Quick Links</h3>
          <div className="space-y-3">
            <button 
              className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
              onClick={() => onNavigate("architecture")}
            >
              <strong className="block text-gray-900 font-medium">Architecture Map</strong>
              <span className="block text-xs text-gray-500 mt-1">View generated Mermaid diagrams</span>
            </button>
            <button 
              className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
              onClick={() => onNavigate("interrogate")}
            >
              <strong className="block text-gray-900 font-medium">Ask Repository</strong>
              <span className="block text-xs text-gray-500 mt-1">Grounded Q&amp;A about codebase</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
