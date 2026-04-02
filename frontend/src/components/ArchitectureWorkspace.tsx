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
    <div className="flex flex-col gap-6 h-full max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Architecture Map</h2>
          <p className="text-sm text-gray-500 mt-1">Generated from parsed repository structure and import relationships.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700">
            <span className="text-gray-500 mr-2">Files:</span>
            {summary?.file_count ?? 0}
          </div>
          <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700">
            <span className="text-gray-500 mr-2">Modules:</span>
            {summary?.major_modules.length ?? 0}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <DiagramTabs diagrams={diagrams} loading={loading} />
      </div>
    </div>
  );
}
