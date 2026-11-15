import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  askRepository,
  deleteRepository,
  extractApiError,
  fetchCachedInsights,
  fetchDiagrams,
  fetchInsights,
  fetchRepositories,
  fetchSummary,
  fetchUsage,
  indexRepository,
  loadRepository,
  type AskResponse,
  type Diagram,
  type RepoHistoryItem,
  type RepoInsights,
  type Summary,
  type Usage
} from "@/api/client";
import { AppSidebar, type WorkspaceView } from "@/components/AppSidebar";
import { ArchitectureWorkspace } from "@/components/ArchitectureWorkspace";
import { AskWorkspace, type ChatTurn } from "@/components/AskWorkspace";
import { BriefingWorkspace, type IndexState } from "@/components/BriefingWorkspace";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/icons/Icons";

function parseView(): WorkspaceView {
  const hash = window.location.hash.replace("#", "");
  if (hash === "architecture") return "architecture";
  if (hash === "ask" || hash === "interrogate") return "ask";
  return "briefing";
}

const INITIAL_INDEX_STATE: IndexState = {
  status: "idle",
  message: "Repo Q&A becomes available after indexing finishes."
};

export default function App() {
  const [view, setView] = useState<WorkspaceView>(parseView);
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("reposketch-theme");
    if (stored) return stored === "dark";
    return true;
  });
  const [repoUrl, setRepoUrl] = useState("");
  const [activeRepoId, setActiveRepoId] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [history, setHistory] = useState<RepoHistoryItem[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [insights, setInsights] = useState<RepoInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [indexState, setIndexState] = useState<IndexState>(INITIAL_INDEX_STATE);
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [asking, setAsking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const runRef = useRef(0);
  const autoOpenedRef = useRef(false);

  const refreshHistory = useCallback(async () => {
    try {
      setHistory(await fetchRepositories());
    } catch {
      // The sidebar is non-critical; the main workspace still works.
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("reposketch-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const onHashChange = () => setView(parseView());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const refreshUsage = useCallback(async () => {
    try {
      setUsage(await fetchUsage());
    } catch {
      // Usage is a non-critical sidebar panel.
    }
  }, []);

  useEffect(() => {
    void refreshUsage();
    void refreshHistory();
  }, [refreshHistory, refreshUsage]);

  const navigate = (next: WorkspaceView) => {
    startTransition(() => setView(next));
    window.history.replaceState(null, "", `#${next}`);
    setSidebarOpen(false);
  };

  const resetWorkspace = () => {
    runRef.current += 1;
    localStorage.removeItem("reposketch-active-repo");
    setActiveRepoId(null);
    setSummary(null);
    setDiagrams([]);
    setInsights(null);
    setInsightsError(null);
    setWarnings([]);
    setError(null);
    setStatusText(null);
    setTurns([]);
    setIndexState(INITIAL_INDEX_STATE);
  };

  const handleNewAnalysis = () => {
    resetWorkspace();
    setRepoUrl("");
    navigate("briefing");
  };

  const handleAnalyze = async (url: string) => {
    const targetUrl = url.trim();
    if (!targetUrl || loadingRepo) return;
    if (usage && usage.remaining < 35) {
      setError(
        `A full analysis costs 35 credits (10 analyze + 20 index + 5 briefing). You have ${usage.remaining} left today.`
      );
      navigate("briefing");
      return;
    }

    const run = ++runRef.current;
    setLoadingRepo(true);
    setError(null);
    setStatusText("Cloning the repository and parsing its structure...");
    setSummary(null);
    setDiagrams([]);
    setInsights(null);
    setInsightsError(null);
    setWarnings([]);
    setTurns([]);
    setActiveRepoId(null);
    setIndexState(INITIAL_INDEX_STATE);
    setRepoUrl(targetUrl);

    try {
      const loaded = await loadRepository(targetUrl);
      if (run !== runRef.current) return;

      const repoId = loaded.summary.repo_id;
      localStorage.setItem("reposketch-active-repo", repoId);
      setActiveRepoId(repoId);
      setSummary(loaded.summary);
      setDiagrams(loaded.diagrams);
      setWarnings(loaded.warnings.length ? loaded.warnings : loaded.metadata.warnings ?? []);
      setStatusText(`Repository loaded: ${loaded.summary.repo_name}. Building retrieval index...`);
      setIndexState({
        status: "indexing",
        message: "Indexing source files for grounded Q&A..."
      });
      navigate("architecture");
      setLoadingRepo(false);

      setInsightsLoading(true);
      const insightsPromise = fetchInsights(repoId);
      const indexPromise = indexRepository(repoId);

      try {
        const insightData = await insightsPromise;
        if (run === runRef.current && insightData.insights) {
          setInsights(insightData.insights);
          setInsightsError(null);
        }
      } catch (insightError) {
        if (run === runRef.current) {
          setInsightsError(extractApiError(insightError));
        }
      } finally {
        if (run === runRef.current) {
          setInsightsLoading(false);
          void refreshUsage();
        }
      }

      try {
        const indexData = await indexPromise;
        if (run !== runRef.current) return;
        setIndexState({
          status: "ready",
          message: `Indexed ${indexData.indexed_files} files into ${indexData.indexed_chunks} chunks with ${indexData.embedding_provider}.`,
          provider: indexData.embedding_provider,
          chunks: indexData.indexed_chunks
        });
        setSummary((current) =>
          current ? { ...current, indexed_file_count: indexData.indexed_files } : current
        );
        if (indexData.warnings.length) {
          setWarnings((current) => [...new Set([...current, ...indexData.warnings])]);
        }
        setStatusText(`Repository loaded and indexed: ${loaded.summary.repo_name}.`);
      } catch (indexError) {
        if (run !== runRef.current) return;
        setIndexState({
          status: "error",
          message: extractApiError(indexError)
        });
        setStatusText(`Repository analyzed: ${loaded.summary.repo_name}. Q&A indexing is unavailable.`);
      } finally {
        if (run === runRef.current) {
          void refreshHistory();
          void refreshUsage();
        }
      }
    } catch (loadError) {
      if (run !== runRef.current) return;
      setError(extractApiError(loadError));
      setStatusText(null);
      setLoadingRepo(false);
      void refreshUsage();
    }
  };

  const handleSelectRepo = async (repoId: string, navigateOnOpen = true) => {
    if (repoId === activeRepoId && summary) {
      setSidebarOpen(false);
      return;
    }
    const item = history.find((entry) => entry.repo_id === repoId);
    localStorage.setItem("reposketch-active-repo", repoId);
    setActiveRepoId(repoId);
    setError(null);
    setTurns([]);
    setInsights(null);
    setInsightsError(null);
    setLoadingRepo(true);
    setStatusText(`Loading ${item?.repo_name ?? repoId}...`);

    try {
      const [summaryData, diagramData, insightData] = await Promise.all([
        fetchSummary(repoId),
        fetchDiagrams(repoId),
        fetchCachedInsights(repoId)
      ]);
      setSummary(summaryData);
      setDiagrams(diagramData.diagrams);
      setInsights(insightData);
      setRepoUrl(summaryData.repo_url);
      setWarnings([]);
      setIndexState(
        item && item.indexed_chunks > 0
          ? {
              status: "ready",
              message: `Indexed ${item.indexed_chunks} chunks with ${item.embedding_provider ?? "local-hash"}.`,
              provider: item.embedding_provider ?? "local-hash",
              chunks: item.indexed_chunks
            }
          : INITIAL_INDEX_STATE
      );
      if (navigateOnOpen) {
        navigate("architecture");
      } else {
        setView(parseView());
      }
      setStatusText(null);
    } catch (loadError) {
      setError(extractApiError(loadError));
      setSummary(null);
      setDiagrams([]);
      await refreshHistory();
    } finally {
      setLoadingRepo(false);
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    if (autoOpenedRef.current || activeRepoId || history.length === 0) return;
    const saved = localStorage.getItem("reposketch-active-repo");
    const target = history.find((item) => item.repo_id === saved) ?? history[0];
    if (!target) return;
    autoOpenedRef.current = true;
    void handleSelectRepo(target.repo_id, false);
    // Run once when history first loads; later navigation is user-driven.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, activeRepoId]);

  const handleDeleteRepo = async (repoId: string) => {
    const item = history.find((entry) => entry.repo_id === repoId);
    if (!window.confirm(`Remove ${item?.repo_name ?? repoId} and its local index?`)) return;
    try {
      await deleteRepository(repoId);
      if (activeRepoId === repoId) resetWorkspace();
      await refreshHistory();
    } catch (deleteError) {
      setError(extractApiError(deleteError));
    }
  };

  const handleGenerateInsights = async () => {
    if (!activeRepoId || insightsLoading) return;
    if (usage && usage.remaining < 5) {
      setInsightsError(`Generating a briefing costs 5 credits. You have ${usage.remaining} left today.`);
      return;
    }
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const data = await fetchInsights(activeRepoId, true);
      setInsights(data.insights);
      void refreshHistory();
    } catch (insightError) {
      setInsightsError(extractApiError(insightError));
    } finally {
      setInsightsLoading(false);
      void refreshUsage();
    }
  };

  const askDisabledReason = !activeRepoId
    ? "Analyze a repository first."
    : indexState.status === "indexing"
      ? "Indexing is still running."
      : indexState.status === "error"
        ? "Q&A is unavailable until indexing succeeds."
        : usage && usage.remaining < 2
          ? "Not enough credits for a question (2 needed)."
          : indexState.status !== "ready"
            ? "This repository has no retrieval index yet. Re-analyze or index it first."
            : null;

  const handleAsk = async (question: string) => {
    if (!activeRepoId || asking || askDisabledReason) return;
    const id = `turn-${Date.now()}`;
    setTurns((current) => [
      ...current,
      { id, question, response: null, pending: true, error: null }
    ]);
    setAsking(true);

    try {
      const response = await askRepository(activeRepoId, question);
      setTurns((current) =>
        current.map((turn) =>
          turn.id === id ? { ...turn, response, pending: false, error: null } : turn
        )
      );
      navigate("ask");
    } catch (askError) {
      const detail = extractApiError(askError);
      setTurns((current) =>
        current.map((turn) =>
          turn.id === id ? { ...turn, pending: false, error: detail } : turn
        )
      );
    } finally {
      setAsking(false);
      void refreshUsage();
    }
  };

  const activeRepoName = useMemo(
    () => summary?.repo_name ?? history.find((item) => item.repo_id === activeRepoId)?.repo_name ?? null,
    [summary, history, activeRepoId]
  );

  return (
    <div className="app-shell text-ink">
      <AppSidebar
        activeView={view}
        history={history}
        activeRepoId={activeRepoId}
        usage={usage}
        indexStatus={indexState.status}
        onNavigate={navigate}
        onSelectRepo={(repoId) => void handleSelectRepo(repoId)}
        onDeleteRepo={(repoId) => void handleDeleteRepo(repoId)}
        onNewAnalysis={handleNewAnalysis}
      />

      <div className="app-main">
        <TopBar
          activeView={view}
          repoName={activeRepoName}
          repoUrl={repoUrl}
          usage={usage}
          loading={loadingRepo}
          dark={dark}
          onToggleTheme={() => setDark((current) => !current)}
          onChangeView={navigate}
          onAnalyze={(url) => void handleAnalyze(url)}
          onOpenHistory={() => setSidebarOpen(true)}
        />

        <main className="app-content">
          {error && view !== "briefing" ? (
            <div className="mb-4 flex items-start gap-2.5 rounded-[12px] border border-red/25 bg-red-tint p-3.5 text-[12.5px] leading-5 text-red">
              <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <strong className="block font-semibold">Request failed</strong>
                <p className="break-words">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="flex size-6 shrink-0 items-center justify-center rounded-[6px] hover:bg-red/10"
                aria-label="Dismiss error"
              >
                <Icon name="close" size={13} />
              </button>
            </div>
          ) : null}

          {view === "briefing" ? (
            <BriefingWorkspace
              summary={summary}
              loading={loadingRepo}
              statusText={statusText}
              warnings={warnings}
              indexState={indexState}
              insights={insights}
              insightsLoading={insightsLoading}
              insightsError={insightsError}
              error={error}
              creditsRemaining={usage?.remaining ?? null}
              onAnalyze={(url) => void handleAnalyze(url)}
              onGenerateInsights={() => void handleGenerateInsights()}
              onNavigate={navigate}
            />
          ) : null}

          {view === "architecture" ? (
            <ArchitectureWorkspace
              summary={summary}
              diagrams={diagrams}
              loading={loadingRepo}
              insights={insights}
              insightsLoading={insightsLoading}
              insightsError={insightsError}
              dark={dark}
              onGenerateInsights={() => void handleGenerateInsights()}
              onNavigate={navigate}
            />
          ) : null}

          {view === "ask" ? (
            <AskWorkspace
              repoName={activeRepoName}
              turns={turns}
              loading={asking}
              disabledReason={askDisabledReason}
              indexState={indexState}
              insights={insights}
              onAsk={(question) => void handleAsk(question)}
            />
          ) : null}
        </main>
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close repository history"
          />
          <div className="relative z-10 h-full w-60 bg-page shadow-overlay">
            <AppSidebar
              activeView={view}
              history={history}
              activeRepoId={activeRepoId}
              usage={usage}
              indexStatus={indexState.status}
              onNavigate={navigate}
              onSelectRepo={(repoId) => void handleSelectRepo(repoId)}
              onDeleteRepo={(repoId) => void handleDeleteRepo(repoId)}
              onNewAnalysis={handleNewAnalysis}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
