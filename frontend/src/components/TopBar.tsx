import { useEffect, useState } from "react";
import type { Usage } from "@/api/client";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/icons/Icons";
import type { WorkspaceView } from "@/components/AppSidebar";
import { UsagePill } from "@/components/UsageMeter";
import { cn } from "@/lib/utils";

const VIEW_LABELS: Record<WorkspaceView, string> = {
  briefing: "Briefing",
  architecture: "Architecture",
  ask: "Interrogate"
};

export function TopBar({
  activeView,
  repoName,
  repoUrl,
  usage,
  loading,
  dark,
  onToggleTheme,
  onChangeView,
  onAnalyze,
  onOpenHistory
}: {
  activeView: WorkspaceView;
  repoName: string | null;
  repoUrl: string;
  usage: Usage | null;
  loading: boolean;
  dark: boolean;
  onToggleTheme: () => void;
  onChangeView: (view: WorkspaceView) => void;
  onAnalyze: (url: string) => void;
  onOpenHistory: () => void;
}) {
  const [draft, setDraft] = useState(repoUrl);

  useEffect(() => {
    setDraft(repoUrl);
  }, [repoUrl]);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/80 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        <button
          type="button"
          onClick={onOpenHistory}
          className="flex size-8 items-center justify-center rounded-[8px] border border-line bg-surface text-ink-2 shadow-btn lg:hidden"
          aria-label="Open repository history"
        >
          <Icon name="history" size={15} />
        </button>

        <div className="hidden min-w-0 items-center gap-2 text-[12px] lg:flex">
          <span className="font-medium text-ink-3">Workspace</span>
          <Icon name="chevron-right" size={12} className="text-ink-3" />
          <span className="font-medium text-ink-2">{VIEW_LABELS[activeView]}</span>
          {repoName ? (
            <>
              <Icon name="chevron-right" size={12} className="text-ink-3" />
              <span className="max-w-52 truncate font-mono text-[11.5px] text-ink">{repoName}</span>
            </>
          ) : null}
        </div>

        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 lg:flex-none">
          <form
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full border border-line bg-surface p-1 pl-3 shadow-btn focus-within:border-line-strong lg:w-[26rem] lg:flex-none"
            onSubmit={(event) => {
              event.preventDefault();
              onAnalyze(draft);
            }}
          >
            <Icon name="github" size={14} className="shrink-0 text-ink-3" />
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="https://github.com/owner/repo"
              className="min-w-0 flex-1 bg-transparent py-1 font-mono text-[11.5px] text-ink outline-none placeholder:text-ink-3"
              disabled={loading}
              aria-label="Repository URL"
            />
            <Button type="submit" size="xs" variant="primary" disabled={loading || !draft.trim()}>
              {loading ? <Icon name="loader" size={13} className="animate-spin" /> : null}
              {loading ? "Working" : "Analyze"}
            </Button>
          </form>

          <UsagePill usage={usage} className="hidden sm:inline-flex" />

          <button
            type="button"
            onClick={onToggleTheme}
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-2 shadow-btn transition-colors hover:bg-inset hover:text-ink"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
          >
            <Icon name={dark ? "sun" : "moon"} size={15} />
          </button>

          <a
            href="https://github.com/xDipzz/reposketch-fastapi"
            target="_blank"
            rel="noreferrer"
            className="hidden size-8 items-center justify-center rounded-full border border-line bg-surface text-ink-2 shadow-btn transition-colors hover:bg-inset hover:text-ink sm:flex"
            aria-label="Open RepoSketch on GitHub"
            title="GitHub repository"
          >
            <Icon name="github" size={15} />
          </a>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-t border-line px-3 py-1.5 lg:hidden">
        {(Object.keys(VIEW_LABELS) as WorkspaceView[]).map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => onChangeView(view)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
              activeView === view
                ? "bg-ink text-canvas"
                : "text-ink-2 hover:bg-hover"
            )}
          >
            {VIEW_LABELS[view]}
          </button>
        ))}
        <UsagePill usage={usage} className="ml-auto shrink-0" />
      </div>
    </header>
  );
}
