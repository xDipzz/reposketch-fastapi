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
  const repoName = summary?.repo_name ?? "Repository";
  const fileCount = summary?.file_count ?? 0;
  const moduleCount = summary?.major_modules.length ?? 0;
  const indexedFileCount = summary?.indexed_file_count ?? 0;

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-5 animate-fade-up">
      <div className="flex shrink-0 flex-col items-start justify-between gap-5 md:flex-row md:items-end">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 shadow-sm backdrop-blur">
            Architecture
          </div>
          <h2 className="text-3xl font-semibold tracking-normal text-white md:text-4xl">
            Architecture Map
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Generated from parsed repository structure and import relationships for{" "}
            <span className="font-mono text-slate-300">{repoName}</span>.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
          <button
            className="btn-secondary h-9 px-3 text-xs"
            onClick={() => onNavigate("interrogate")}
            type="button"
          >
            Ask from this map
          </button>
          <div className="grid w-full grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-sm backdrop-blur md:w-auto">
          <div className="bg-black/45 px-3 py-2">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Files</span>
            <strong className="mt-1 block font-mono text-lg font-semibold text-white">{fileCount}</strong>
          </div>
          <div className="bg-black/45 px-3 py-2">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Modules</span>
            <strong className="mt-1 block font-mono text-lg font-semibold text-white">{moduleCount}</strong>
          </div>
          <div className="bg-white px-3 py-2">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">Indexed</span>
            <strong className="mt-1 block font-mono text-lg font-semibold text-black">{indexedFileCount}</strong>
          </div>
          </div>
        </div>
      </div>

      <div className="premium-panel relative flex min-h-[44rem] flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/15" />
        <DiagramTabs diagrams={diagrams} loading={loading} />
      </div>
    </div>
  );
}
