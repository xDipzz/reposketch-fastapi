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
    <div className="flex flex-col h-full max-w-[1600px] mx-auto gap-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Interrogate Codebase</h2>
          <p className="text-sm text-gray-500 mt-1">Ask architecture, routing, configuration, or flow questions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {summary?.repo_name && (
            <div className="px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-800 rounded-lg shadow-sm text-sm font-medium">
              <span className="opacity-75 mr-2">Target:</span>
              {summary.repo_name}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6">
        <div className="flex-1 min-h-0 flex flex-col">
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
    </div>
  );
}
