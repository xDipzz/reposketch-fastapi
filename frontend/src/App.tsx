import { startTransition, useEffect, useState } from "react";

import {
  askRepository,
  extractApiError,
  fetchDiagrams,
  fetchSummary,
  indexRepository,
  loadRepository,
  type AskResponse,
  type Diagram,
  type Summary
} from "./api/client";
import { ArchitectureWorkspace } from "./components/ArchitectureWorkspace";
import { InterrogateWorkspace } from "./components/InterrogateWorkspace";
import { OverviewWorkspace } from "./components/OverviewWorkspace";
import { WorkspaceNav, type WorkspaceView } from "./components/WorkspaceNav";

type IndexState = {
  status: "idle" | "indexing" | "ready" | "error";
  message: string | null;
};

function getInitialView(): WorkspaceView {
  if (typeof window === "undefined") {
    return "briefing";
  }

  const hash = window.location.hash.replace("#", "");
  if (hash === "briefing" || hash === "architecture" || hash === "interrogate") {
    return hash;
  }
  return "briefing";
}

export default function App() {
  const [view, setView] = useState<WorkspaceView>(getInitialView);
  const [repoUrl, setRepoUrl] = useState("");
  const [repoId, setRepoId] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askError, setAskError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [indexState, setIndexState] = useState<IndexState>({
    status: "idle",
    message: "Repo Q&A becomes available after indexing finishes."
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "briefing" || hash === "architecture" || hash === "interrogate") {
        setView(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const handleViewChange = (nextView: WorkspaceView) => {
    startTransition(() => {
      setView(nextView);
    });
    window.history.replaceState(null, "", `#${nextView}`);
  };

  const handleAnalyze = async (urlToAnalyze?: string) => {
    const targetUrl = urlToAnalyze ?? repoUrl;
    if (!targetUrl.trim()) {
      return;
    }
    if (urlToAnalyze && urlToAnalyze !== repoUrl) {
      setRepoUrl(urlToAnalyze);
    }

    try {
      setLoadingRepo(true);
      setError(null);
      setAskError(null);
      setAnswer(null);
      setWarnings([]);
      setRepoId(null);
      setStatusText("Cloning the repository and parsing its structure...");
      setIndexState({
        status: "idle",
        message: "Repo Q&A becomes available after indexing finishes."
      });

      const loadData = await loadRepository(targetUrl);
      const nextRepoId = loadData.summary.repo_id;
      setRepoId(nextRepoId);
      setWarnings(loadData.warnings.length ? loadData.warnings : loadData.metadata.warnings ?? []);

      const [summaryData, diagramData] = await Promise.all([
        fetchSummary(nextRepoId),
        fetchDiagrams(nextRepoId)
      ]);

      setSummary(summaryData);
      setDiagrams(diagramData.diagrams);
      handleViewChange("architecture");
      setStatusText(`Repository loaded: ${summaryData.repo_name}. Building retrieval index...`);
      setIndexState({
        status: "indexing",
        message: "Indexing repository files for grounded Q&A..."
      });

      try {
        const indexData = await indexRepository(nextRepoId);
        setSummary((current) =>
          current
            ? {
                ...current,
                indexed_file_count: indexData.indexed_files
              }
            : current
        );
        setIndexState({
          status: "ready",
          message: `Indexed ${indexData.indexed_files} files into ${indexData.indexed_chunks} chunks.`
        });
        setStatusText(`Repository loaded and indexed: ${summaryData.repo_name}.`);
      } catch (indexError) {
        const detail = extractApiError(indexError);
        setIndexState({
          status: "error",
          message: detail
        });
        setStatusText(`Repository analyzed: ${summaryData.repo_name}. Q&A indexing is unavailable.`);
      }
    } catch (loadError) {
      setError(extractApiError(loadError));
      setStatusText(null);
    } finally {
      setLoadingRepo(false);
    }
  };

  const handleAsk = async (question: string) => {
    try {
      setAsking(true);
      setError(null);
      setAskError(null);
      const data = await askRepository(repoId, question);
      setAnswer(data);
      handleViewChange("interrogate");
    } catch (askRequestError) {
      setAskError(extractApiError(askRequestError));
    } finally {
      setAsking(false);
    }
  };

  const askDisabled = !repoId || loadingRepo || indexState.status !== "ready";
  const askDisabledReason = !repoId
    ? "Analyze a repository first."
    : loadingRepo
      ? "Wait for analysis to finish."
      : indexState.status === "indexing"
        ? "Indexing is still running."
        : indexState.status === "error"
          ? "Q&A is unavailable until backend indexing succeeds."
          : null;

  const showCommandBar = Boolean(summary || loadingRepo || view !== "briefing");

  return (
    <div className="relative flex min-h-screen w-screen flex-col overflow-hidden bg-black text-white font-sans">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(59,130,246,0.18),transparent_34rem),radial-gradient(circle_at_20%_40%,rgba(148,163,184,0.08),transparent_28rem),linear-gradient(180deg,#030303_0%,#06070a_48%,#000_100%)]" />
      <WorkspaceNav
        activeView={view}
        indexStatus={indexState.status}
        onChange={handleViewChange}
      />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {showCommandBar ? (
        <header className="z-20 mx-auto mt-3 w-full max-w-6xl shrink-0 px-4">
          <div className="flex items-center justify-between gap-3 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 shadow-[0_24px_90px_-70px_rgba(255,255,255,0.35)] backdrop-blur-2xl">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <input
                className="h-10 min-w-0 flex-1 rounded-full border border-white/10 bg-black/45 px-5 font-mono text-[12px] text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-white/25 focus:bg-black/70 focus:ring-4 focus:ring-white/5"
                placeholder="https://github.com/owner/project"
                value={repoUrl}
                disabled={loadingRepo}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAnalyze();
                }}
              />
              <button
                className="inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={loadingRepo || !repoUrl.trim()} 
                onClick={() => handleAnalyze()}
              >
                {loadingRepo ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  "Analyze Repo"
                )}
              </button>
            </div>

            <div className="hidden items-center gap-2 lg:flex">
            {repoId ? (
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 signal-pulse" />
                <div className="min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Active</span>
                  <strong className="block max-w-[180px] truncate font-mono text-xs text-slate-200">{summary?.repo_name ?? "Loading..."}</strong>
                </div>
              </div>
            ) : (
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-500">No repository loaded</div>
            )}
            </div>
          </div>
        </header>
        ) : null}

        <main className="relative flex-1 overflow-auto px-5 py-6 lg:px-8 lg:py-7">
          {error ? (
            <div className="mx-auto mb-6 max-w-6xl rounded-2xl border border-red-400/20 bg-red-500/10 p-4 shadow-sm backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <div className="text-red-300 mt-0.5">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-red-100">Error analyzing repository</h3>
                  <p className="text-sm text-red-200/80 mt-1">{error}</p>
                </div>
              </div>
            </div>
          ) : null}

          {view === "briefing" ? (
            <OverviewWorkspace
              repoUrl={repoUrl}
              loading={loadingRepo}
              statusText={statusText}
              repoName={summary?.repo_name ?? null}
              summary={summary}
              warnings={warnings}
              indexMessage={indexState.message}
              indexStatus={indexState.status}
              onChangeRepoUrl={setRepoUrl}
              onAnalyze={() => handleAnalyze()}
              onNavigate={handleViewChange}
            />
          ) : null}

          {view === "architecture" ? (
            <ArchitectureWorkspace
              summary={summary}
              diagrams={diagrams}
              loading={loadingRepo}
              onNavigate={handleViewChange}
            />
          ) : null}

          {view === "interrogate" ? (
            <InterrogateWorkspace
              summary={summary}
              response={answer}
              loading={asking}
              disabled={askDisabled}
              disabledReason={askDisabledReason}
              statusMessage={indexState.message}
              error={askError}
              onAsk={handleAsk}
              onNavigate={handleViewChange}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}
