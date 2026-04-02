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

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) {
      return;
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

      const loadData = await loadRepository(repoUrl);
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
    <div className="app-shell">
      <div className="ambient-noise" />
      <div className="ambient-orb orb-a" />
      <div className="ambient-orb orb-b" />
      <div className="ambient-orb orb-c" />

      <main className="page-frame">
        <WorkspaceNav
          activeView={view}
          indexStatus={indexState.status}
          repoName={summary?.repo_name ?? null}
          repoId={repoId}
          onChange={handleViewChange}
        />

        {error ? <div className="error-banner">{error}</div> : null}

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
            onAnalyze={handleAnalyze}
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
  );
}
