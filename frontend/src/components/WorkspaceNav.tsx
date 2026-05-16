export type WorkspaceView = "briefing" | "architecture" | "interrogate";

type WorkspaceNavProps = {
  activeView: WorkspaceView;
  indexStatus: "idle" | "indexing" | "ready" | "error";
  onChange: (view: WorkspaceView) => void;
};

const workspaces = [
  { id: "briefing" as const, label: "Briefing", blurb: "Ingest and summary", glyph: "01" },
  { id: "architecture" as const, label: "Architecture", blurb: "Diagram workspace", glyph: "02" },
  { id: "interrogate" as const, label: "Interrogate", blurb: "Grounded Q&A", glyph: "03" }
];

export function WorkspaceNav({ activeView, indexStatus, onChange }: WorkspaceNavProps) {
  const statusTone =
    indexStatus === "ready"
      ? "bg-emerald-500"
      : indexStatus === "indexing"
        ? "bg-amber-500 signal-pulse"
        : indexStatus === "error"
          ? "bg-red-500"
          : "bg-slate-300";

  return (
    <header className="relative z-30 mx-auto flex w-full max-w-6xl shrink-0 items-center justify-between gap-4 px-5 pb-16 pt-6 md:pb-6 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-white text-black shadow-[0_0_40px_-18px_rgba(255,255,255,0.9)]">
          <span className="text-[12px] font-black">RS</span>
        </div>
        <div className="min-w-0">
          <h1 className="leading-tight text-sm font-bold text-white">RepoSketch</h1>
          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.28em] text-slate-500">Code intelligence</p>
        </div>
      </div>

      <nav className="hidden items-center rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl md:flex">
        {workspaces.map((workspace) => {
          const isActive = activeView === workspace.id;
          return (
            <button
              key={workspace.id}
              className={`group inline-flex items-center gap-2 rounded-full px-4 py-2 text-left transition-all duration-200 ${
                isActive
                  ? "bg-white text-black shadow-[0_10px_40px_-28px_rgba(255,255,255,0.9)]"
                  : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
              }`}
              onClick={() => onChange(workspace.id)}
              type="button"
            >
              <span className={`font-mono text-[10px] font-semibold ${isActive ? "text-black/45" : "text-slate-600 group-hover:text-slate-500"}`}>
                {workspace.glyph}
              </span>
              <span className="min-w-0 leading-none">
                <strong className="block text-sm font-semibold">
                  {workspace.label}
                </strong>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur-xl">
        <span className={`h-2 w-2 shrink-0 rounded-full ${statusTone}`} />
        <span className="hidden text-xs font-semibold text-slate-300 sm:inline">
          {indexStatus === "idle" && "Awaiting index"}
          {indexStatus === "indexing" && "Indexing"}
          {indexStatus === "ready" && "Ready"}
          {indexStatus === "error" && "Index failed"}
        </span>
      </div>

      <nav className="absolute inset-x-5 top-[4.75rem] flex items-center gap-2 overflow-x-auto pb-2 md:hidden">
        {workspaces.map((workspace) => {
          const isActive = activeView === workspace.id;
          return (
            <button
              key={workspace.id}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                isActive ? "bg-white text-black" : "border border-white/10 bg-white/[0.04] text-slate-400"
              }`}
              onClick={() => onChange(workspace.id)}
              type="button"
            >
              {workspace.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
