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
    <div className="mx-auto flex w-full flex-col gap-6">
      <div className="flex shrink-0 flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Architecture Map</h2>
          <p className="mt-1 text-sm text-gray-500">Generated from parsed repository structure and import relationships.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm">
            <span className="mr-2 text-gray-500">Files:</span>
            {summary?.file_count ?? 0}
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm">
            <span className="mr-2 text-gray-500">Modules:</span>
            {summary?.major_modules.length ?? 0}
          </div>
        </div>
      </div>

      <div className="flex flex-col rounded-[28px] border border-gray-200 bg-white shadow-sm">
        <DiagramTabs diagrams={diagrams} loading={loading} />
      </div>
    </div>
  );
}
