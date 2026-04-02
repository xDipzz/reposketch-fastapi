import { useState } from "react";
import ReactMarkdown from "react-markdown";

import type { AskResponse } from "../api/client";
import { SourceList } from "./SourceList";

const sampleQuestions = [
  "Which file looks like the main entry point?",
  "Where is API routing defined?",
  "How are the main modules connected?",
  "Where is configuration initialized?"
];

type AskPanelProps = {
  response: AskResponse | null;
  loading: boolean;
  disabled: boolean;
  disabledReason: string | null;
  statusMessage: string | null;
  error: string | null;
  onAsk: (question: string) => void;
};

export function AskPanel({
  response,
  loading,
  disabled,
  disabledReason,
  statusMessage,
  error,
  onAsk
}: AskPanelProps) {
  const [question, setQuestion] = useState("");
  const visibleChunks = response?.retrieved_chunks.slice(0, 6) ?? [];

  const submit = () => {
    const nextQuestion = question.trim();
    if (!nextQuestion || disabled || loading) {
      return;
    }
    onAsk(nextQuestion);
  };

  return (
    <section className="panel ask-workspace">
      <div className="ask-header">
        <div>
          <p className="eyebrow">Ask Repo</p>
          <h2 className="panel-title">Interrogate the codebase</h2>
          <p className="panel-copy">
            Ask architecture, routing, configuration, or flow questions. Answers stay pinned to
            retrieved repository context.
          </p>
        </div>
        <div className="badge">grounded answers only</div>
      </div>

      <div className="ask-composer">
        <textarea
          className="ask-input"
          placeholder="How does authentication work?"
          rows={5}
          value={question}
          disabled={disabled}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <div className="ask-actions">
          <button className="primary-button" disabled={disabled || loading} onClick={submit} type="button">
            {loading ? "Thinking..." : "Ask repository"}
          </button>
          <span className="keyboard-hint">Ctrl/Cmd + Enter</span>
        </div>
      </div>

      {statusMessage ? <div className="status-banner subtle">{statusMessage}</div> : null}
      {error ? <div className="warning-card">{error}</div> : null}
      {disabled && disabledReason ? (
        <div className="placeholder-card compact">{disabledReason}</div>
      ) : null}

      <div className="ask-samples">
        <p className="mini-label">Sample questions</p>
        <div className="sample-list">
          {sampleQuestions.map((item) => (
            <button key={item} className="sample-chip" onClick={() => setQuestion(item)} type="button">
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="answer-shell">
        {response ? (
          <div className="answer-layout">
            <article className="answer-card">
              <div className="answer-card-head">
                <p className="mini-label">Response</p>
                <div className="badge muted">{response.repo_name}</div>
              </div>
              <div className="markdown-body">
                <ReactMarkdown>{response.answer}</ReactMarkdown>
              </div>
            </article>

            <div className="evidence-stack">
              <section className="evidence-card">
                <p className="mini-label">Sources</p>
                <SourceList sources={response.sources} />
              </section>

              <section className="evidence-card">
                <p className="mini-label">Retrieved context</p>
                <ul className="context-list">
                  {visibleChunks.map((chunk) => (
                    <li key={`${chunk.file_path}-${chunk.chunk_index}`} className="context-card">
                      <div className="context-header">
                        <strong>{chunk.file_path}</strong>
                        <span>chunk {chunk.chunk_index}</span>
                      </div>
                      {chunk.symbol_names.length ? (
                        <p className="context-symbols">{chunk.symbol_names.join(", ")}</p>
                      ) : null}
                      <p>{chunk.preview}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        ) : (
          <div className="placeholder-card">
            Ask a question after analyzing a repository. This workspace will return a grounded
            answer, explicit source files, and the chunk evidence used to produce it.
          </div>
        )}
      </div>
    </section>
  );
}
