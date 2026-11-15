import { useMemo, useState } from "react";
import type { Health, RepoHistoryItem } from "@/api/client";
import { GlideMenu } from "@/components/atoms/GlideMenu";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Icon, type IconName } from "@/components/icons/Icons";
import { cn } from "@/lib/utils";

export type WorkspaceView = "briefing" | "architecture" | "ask";

const NAV_ITEMS: { id: WorkspaceView; label: string; icon: IconName; hint: string }[] = [
  { id: "briefing", label: "Briefing", icon: "home", hint: "Ingest + summary" },
  { id: "architecture", label: "Architecture", icon: "network", hint: "Diagrams" },
  { id: "ask", label: "Interrogate", icon: "chat", hint: "Grounded Q&A" }
];

type AppSidebarProps = {
  activeView: WorkspaceView;
  history: RepoHistoryItem[];
  activeRepoId: string | null;
  health: Health | null;
  indexStatus: "idle" | "indexing" | "ready" | "error";
  onNavigate: (view: WorkspaceView) => void;
  onSelectRepo: (repoId: string) => void;
  onDeleteRepo: (repoId: string) => void;
  onNewAnalysis: () => void;
};

export function AppSidebar({
  activeView,
  history,
  activeRepoId,
  health,
  indexStatus,
  onNavigate,
  onSelectRepo,
  onDeleteRepo,
  onNewAnalysis
}: AppSidebarProps) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return history;
    return history.filter(
      (item) =>
        item.repo_name.toLowerCase().includes(needle) ||
        item.repo_url.toLowerCase().includes(needle) ||
        (item.detected_framework ?? "").toLowerCase().includes(needle)
    );
  }, [history, query]);

  return (
    <aside className="app-sidebar flex flex-col p-3">
      <div className="flex items-center gap-2.5 px-1 py-1.5">
        <span className="flex size-8 items-center justify-center rounded-[9px] bg-ink text-canvas shadow-btn">
          <Icon name="logo" size={18} />
        </span>
        <span className="min-w-0">
          <strong className="block text-[14px] font-semibold tracking-tight text-ink">RepoSketch</strong>
          <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">
            Code intelligence
          </span>
        </span>
      </div>

      <button
        type="button"
        onClick={onNewAnalysis}
        className="mt-4 flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-ink px-3 text-[13px] font-medium text-canvas shadow-btn transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]"
      >
        <Icon name="plus" size={15} />
        New analysis
      </button>

      <div className="mt-5">
        <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-3">
          Workspace
        </p>
        <GlideMenu
          rowSelector="[data-nav-row]"
          highlightClassName="inset-x-0 rounded-[8px] bg-hover"
          className="flex flex-col gap-px"
        >
          {NAV_ITEMS.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                data-nav-row
                type="button"
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "relative z-10 flex h-9 items-center gap-2 rounded-[8px] px-2 text-left transition-colors duration-150",
                  active ? "text-ink" : "text-ink-2 hover:text-ink"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center",
                    active ? "text-ink" : "text-ink-3"
                  )}
                >
                  <Icon name={item.icon} size={16} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{item.label}</span>
                <span className="text-[10px] text-ink-3">{item.hint}</span>
              </button>
            );
          })}
        </GlideMenu>
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-2 pb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-3">
            Recent repos
          </span>
          <span className="text-[10px] font-medium tabular-nums text-ink-3">{history.length}</span>
        </div>

        <label className="relative mx-1 mb-2 flex h-8 items-center rounded-[8px] border border-line bg-inset px-2 shadow-inset-field focus-within:border-line-strong">
          <Icon name="search" size={13} className="shrink-0 text-ink-3" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter repos"
            className="min-w-0 flex-1 bg-transparent px-1.5 text-[12px] text-ink outline-none placeholder:text-ink-3"
            aria-label="Filter analyzed repositories"
          />
        </label>

        <div className="scroll-area min-h-0 flex-1 overflow-y-auto pr-0.5">
          {filtered.length ? (
            <div className="flex flex-col gap-px">
              {filtered.map((item) => {
                const active = item.repo_id === activeRepoId;
                return (
                  <div key={item.repo_id} className="group relative">
                    <button
                      type="button"
                      onClick={() => onSelectRepo(item.repo_id)}
                      className={cn("history-row pr-8", active && "is-active")}
                      title={item.repo_url}
                    >
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-[7px] border text-[10px] font-semibold uppercase",
                          active
                            ? "border-accent/30 bg-accent-tint text-accent-ink"
                            : "border-line bg-surface text-ink-3"
                        )}
                      >
                        {item.repo_name.slice(0, 2)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-[12.5px] font-medium text-ink">
                          {item.repo_name}
                        </strong>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-ink-3">
                          <span className="truncate">{item.detected_framework ?? "Python"}</span>
                          <span aria-hidden>·</span>
                          <span className="tabular-nums">{item.file_count} files</span>
                        </span>
                      </span>
                      {item.indexed_chunks > 0 ? (
                        <span
                          className="size-1.5 shrink-0 rounded-full bg-green"
                          title={`${item.indexed_chunks} indexed chunks`}
                        />
                      ) : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRepo(item.repo_id)}
                      className="absolute right-1.5 top-1/2 hidden size-6 -translate-y-1/2 items-center justify-center rounded-[6px] text-ink-3 transition-colors hover:bg-red-tint hover:text-red group-hover:flex"
                      title={`Remove ${item.repo_name}`}
                      aria-label={`Remove ${item.repo_name}`}
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mx-1 rounded-[8px] border border-dashed border-line px-3 py-5 text-center text-[11.5px] leading-5 text-ink-3">
              {history.length ? "No repos match that filter." : "Analyze a repo to build your workspace."}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-[10px] border border-line bg-surface p-2.5 shadow-hairline">
        <div className="flex items-center justify-between gap-2">
          <StatusPill
            tone={indexStatus === "ready" ? "green" : indexStatus === "error" ? "red" : "neutral"}
          >
            {indexStatus === "ready"
              ? "Index ready"
              : indexStatus === "indexing"
                ? "Indexing"
                : indexStatus === "error"
                  ? "Index failed"
                  : "Awaiting index"}
          </StatusPill>
          <Icon name="database" size={13} className="text-ink-3" />
        </div>
        <div className="mt-2.5 flex items-center gap-2 border-t border-line pt-2">
          <span className={cn("size-1.5 rounded-full", health?.ai_configured ? "bg-green" : "bg-orange")} />
          <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-ink-3">
            {health ? health.ai_model : "checking backend..."}
          </span>
          <span className="font-mono text-[9.5px] text-ink-3">{health ? `v${health.version}` : ""}</span>
        </div>
      </div>
    </aside>
  );
}
