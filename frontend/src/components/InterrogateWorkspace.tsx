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
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-5 animate-fade-up">
      <div className="flex shrink-0 flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 inline-flex items-center rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 shadow-sm backdrop-blur">
            Research console
          </div>
          <h2 className="text-3xl font-bold tracking-normal text-white md:text-4xl">Interrogate Codebase</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Ask architecture, routing, configuration, or flow questions from indexed context.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {summary?.repo_name && (
            <div className="rounded-full border border-white bg-white px-3 py-1.5 text-sm font-semibold text-black shadow-sm">
              <span className="mr-2 opacity-75">Target</span>
              {summary.repo_name}
            </div>
          )}
          {summary?.indexed_file_count ? (
            <div className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1.5 text-sm font-semibold text-slate-300 shadow-sm">
              <span className="mr-2 text-slate-400">Indexed</span>
              {summary.indexed_file_count}
            </div>
          ) : null}
          {summary?.detected_framework ? (
            <div className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1.5 text-sm font-semibold text-slate-300 shadow-sm">
              {summary.detected_framework}
            </div>
          ) : null}
          <button className="btn-secondary h-9 px-3 text-xs" onClick={() => onNavigate("architecture")} type="button">
            View map
          </button>
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
