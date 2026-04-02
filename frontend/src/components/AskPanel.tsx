import { useState } from "react";
import ReactMarkdown from "react-markdown";

import type { AskResponse } from "../api/client";
import { SourceList } from "./SourceList";

const sampleQuestions = [
  "Which file looks like the main entry point?",
  "Where are API routes likely defined?",
  "What modules make up the core architecture?"
];

type AskPanelProps = {
  response: AskResponse | null;
  loading: boolean;
  disabled: boolean;
  onAsk: (question: string) => void;
};

export function AskPanel({ response, loading, disabled, onAsk }: AskPanelProps) {
  const [question, setQuestion] = useState("");

  const submit = () => {
    const nextQuestion = question.trim();
    if (!nextQuestion || disabled || loading) {
      return;
    }
    onAsk(nextQuestion);
  };

  return (
    <aside className="panel ask-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Ask Repo</p>
          <h2 className="panel-title">Grounded repository Q&amp;A</h2>
        </div>
      </div>

      <div className="space-y-3">
        <textarea
          className="ask-input"
          placeholder="How does authentication work?"
          rows={6}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <button className="primary-button" disabled={disabled || loading} onClick={submit}>
          {loading ? "Thinking..." : "Ask repository"}
        </button>
      </div>

      <div>
        <p className="mini-label">Sample questions</p>
        <div className="sample-list">
          {sampleQuestions.map((item) => (
            <button key={item} className="sample-chip" onClick={() => setQuestion(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="answer-shell">
        {response ? (
          <>
            <div className="markdown-body">
              <ReactMarkdown>{response.answer}</ReactMarkdown>
            </div>
            <div className="space-y-3">
              <p className="mini-label">Sources</p>
              <SourceList sources={response.sources} />
            </div>
          </>
        ) : (
          <div className="placeholder-card">
            Ask a question after analyzing a repository. The answer panel will stay grounded in the
            indexed source files.
          </div>
        )}
      </div>
    </aside>
  );
}
