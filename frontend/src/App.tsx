import { useState } from "react";

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
import { AskPanel } from "./components/AskPanel";
import { DiagramTabs } from "./components/DiagramTabs";
import { RepoInput } from "./components/RepoInput";
import { SummaryPanel } from "./components/SummaryPanel";

type IndexState = {
  status: "idle" | "indexing" | "ready" | "error";
  message: string | null;
};

export default function App() {
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
      <div className="background-grid" />

      <main className="page">
        <RepoInput
          repoUrl={repoUrl}
          loading={loadingRepo}
          statusText={statusText}
          onChange={setRepoUrl}
          onSubmit={handleAnalyze}
        />

        {error ? <div className="error-banner">{error}</div> : null}

        <section className="content-grid">
          <div className="main-column">
            <SummaryPanel
              summary={summary}
              loading={loadingRepo}
              warnings={warnings}
              indexMessage={indexState.message}
            />
            <DiagramTabs diagrams={diagrams} loading={loadingRepo} />
          </div>

          <AskPanel
            response={answer}
            loading={asking}
            disabled={askDisabled}
            disabledReason={askDisabledReason}
            statusMessage={indexState.message}
            error={askError}
            onAsk={handleAsk}
          />
        </section>
      </main>
    </div>
  );
}
