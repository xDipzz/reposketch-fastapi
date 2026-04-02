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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 text-gray-900 font-sans">
      <WorkspaceNav
        activeView={view}
        indexStatus={indexState.status}
        onChange={handleViewChange}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 shrink-0 shadow-sm relative">
          <div className="flex-1 max-w-3xl">
            <div className="flex items-center gap-3">
              <input
                className="input-field max-w-xl font-mono text-sm bg-gray-50"
                placeholder="https://github.com/owner/project"
                value={repoUrl}
                disabled={loadingRepo}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAnalyze();
                }}
              />
              <button 
                className="btn-primary whitespace-nowrap" 
                disabled={loadingRepo || !repoUrl.trim()} 
                onClick={() => handleAnalyze()}
              >
                {loadingRepo ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
          </div>
          
          <div className="ml-4 flex items-center gap-4">
            {repoId ? (
              <div className="flex flex-col items-end text-right">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Active Repository</span>
                <strong className="text-sm text-gray-900 truncate max-w-[200px] font-mono bg-gray-100 px-2 py-0.5 rounded mt-1">{summary?.repo_name ?? "Loading..."}</strong>
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">No repository loaded</div>
            )}
          </div>
        </header>

        <main className="relative flex-1 overflow-auto p-6 lg:p-8">
          {error ? (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="text-red-600 mt-0.5">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error analyzing repository</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
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
