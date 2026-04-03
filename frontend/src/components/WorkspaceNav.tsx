export type WorkspaceView = "briefing" | "architecture" | "interrogate";

type WorkspaceNavProps = {
  activeView: WorkspaceView;
  indexStatus: "idle" | "indexing" | "ready" | "error";
  onChange: (view: WorkspaceView) => void;
};

const workspaces = [
  { id: "briefing" as const, label: "Briefing", blurb: "Ingest and summary" },
  { id: "architecture" as const, label: "Architecture", blurb: "Diagram workspace" },
  { id: "interrogate" as const, label: "Interrogate", blurb: "Grounded Q&A" }
];

export function WorkspaceNav({ activeView, indexStatus, onChange }: WorkspaceNavProps) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex-center w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-xl shadow-sm flex items-center justify-center">
            RS
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">RepoSketch</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Intelligence</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Workspaces</p>
        {workspaces.map((workspace) => {
          const isActive = activeView === workspace.id;
          return (
            <button
              key={workspace.id}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 border ${
                isActive
                  ? "bg-blue-50 border-blue-100 shadow-sm"
                  : "bg-transparent border-transparent hover:bg-gray-50"
              }`}
              onClick={() => onChange(workspace.id)}
            >
              <strong className={`block text-sm font-semibold ${isActive ? "text-blue-900" : "text-gray-700"}`}>
                {workspace.label}
              </strong>
              <span className={`block text-xs mt-0.5 ${isActive ? "text-blue-700" : "text-gray-500"}`}>
                {workspace.blurb}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Index Status</p>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                indexStatus === "ready" ? "bg-green-500" :
                indexStatus === "indexing" ? "bg-yellow-500 animate-pulse" :
                indexStatus === "error" ? "bg-red-500" : "bg-gray-300"
              }`}
            />
            <span className="text-sm font-medium text-gray-700">
              {indexStatus === "idle" && "Awaiting Index"}
              {indexStatus === "indexing" && "Indexing..."}
              {indexStatus === "ready" && "Ready for Q&A"}
              {indexStatus === "error" && "Index Failed"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
