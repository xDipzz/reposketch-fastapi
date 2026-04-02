import { useState } from "react";

import { askRepository, loadRepository, type AskResponse, type Diagram, type Summary } from "./api/client";
import { AskPanel } from "./components/AskPanel";
import { DiagramTabs } from "./components/DiagramTabs";
import { RepoInput } from "./components/RepoInput";
import { SummaryPanel } from "./components/SummaryPanel";

export default function App() {
  const [repoUrl, setRepoUrl] = useState("");
  const [repoId, setRepoId] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) {
      return;
    }

    try {
      setLoadingRepo(true);
      setError(null);
      setAnswer(null);

      const data = await loadRepository(repoUrl);
      setRepoId(data.summary.repo_id);
      setSummary(data.summary);
      setDiagrams(data.diagrams);
    } catch {
      setError("Repository analysis is not available yet. Check that the backend is running.");
    } finally {
      setLoadingRepo(false);
    }
  };

  const handleAsk = async (question: string) => {
    try {
      setAsking(true);
      setError(null);
      const data = await askRepository(repoId, question);
      setAnswer(data);
    } catch {
      setError("Question answering failed. Make sure the repository has been analyzed first.");
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="background-grid" />

      <main className="page">
        <RepoInput
          repoUrl={repoUrl}
          loading={loadingRepo}
          onChange={setRepoUrl}
          onSubmit={handleAnalyze}
        />

        {error ? <div className="error-banner">{error}</div> : null}

        <section className="content-grid">
          <div className="main-column">
            <SummaryPanel summary={summary} loading={loadingRepo} />
            <DiagramTabs diagrams={diagrams} loading={loadingRepo} />
          </div>

          <AskPanel
            response={answer}
            loading={asking}
            disabled={!repoId || loadingRepo}
            onAsk={handleAsk}
          />
        </section>
      </main>
    </div>
  );
}
