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
    <div className="flex h-full w-full flex-col gap-6">
      <div className="flex shrink-0 flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Interrogate Codebase</h2>
          <p className="mt-1 text-sm text-gray-500">Ask architecture, routing, configuration, or flow questions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {summary?.repo_name && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-800 shadow-sm">
              <span className="mr-2 opacity-75">Target:</span>
              {summary.repo_name}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
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
    </div>
  );
}
