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
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        <div className="shrink-0 border-b border-gray-200 bg-gray-50/60 p-6">
          <div className="relative">
            <textarea
              className="min-h-[120px] w-full resize-none rounded-xl border border-gray-300 bg-white p-4 pr-32 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder={disabled ? disabledReason || "Analyze a repo first" : "How does authentication work?"}
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
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <span className="hidden font-mono text-[10px] text-gray-400 sm:inline">⌘+Enter</span>
              <button
                className="btn-primary rounded-lg px-4 py-1.5 text-sm"
                disabled={disabled || loading || !question.trim()}
                onClick={submit}
                type="button"
              >
                {loading ? (
                  <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "Ask"
                )}
              </button>
            </div>
          </div>

          {error && <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {statusMessage && !response && !loading && !error && (
            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">{statusMessage}</div>
          )}

          {!response && !loading && !disabled && (
            <div className="mt-4 flex flex-wrap gap-2">
              {sampleQuestions.map((item) => (
                <button
                  key={item}
                  className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-200"
                  onClick={() => {
                    setQuestion(item);
                  }}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6">
          {loading ? (
            <div className="flex min-h-[18rem] flex-col items-center justify-center space-y-4">
              <svg className="h-8 w-8 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div className="font-medium text-gray-500">Searching indexed files...</div>
            </div>
          ) : response ? (
            <div className="prose max-w-none">
              <div className="mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                <span className="rounded bg-blue-50 px-2 py-1 text-xs font-bold uppercase tracking-widest text-blue-600">Response</span>
                <span className="text-xs font-mono text-gray-500">{response.repo_name}</span>
              </div>
              <ReactMarkdown>{response.answer}</ReactMarkdown>
            </div>
          ) : (
            <div className="mx-auto flex min-h-[18rem] max-w-sm flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="font-medium text-gray-500">Ask a question to receive a grounded answer with explicit source files and chunks.</p>
            </div>
          )}
        </div>
      </div>

      {response ? (
        <>
          <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-gray-500">Referenced Sources</h3>
            <SourceList sources={response.sources} />
          </div>

          <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.24em] text-gray-500">Retrieved Context</h3>
              <span className="text-xs font-mono text-gray-400">{visibleChunks.length} chunks</span>
            </div>
            <ul className="grid gap-4 lg:grid-cols-2">
              {visibleChunks.map((chunk) => (
                <li key={`${chunk.file_path}-${chunk.chunk_index}`} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="mb-2 flex items-baseline justify-between gap-2 border-b border-gray-200 pb-2">
                    <strong className="truncate font-mono text-sm text-gray-900">{chunk.file_path}</strong>
                    <span className="shrink-0 font-mono text-[10px] text-gray-400">chunk {chunk.chunk_index}</span>
                  </div>
                  {chunk.symbol_names.length ? (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {chunk.symbol_names.map((sym) => (
                        <span key={sym} className="rounded border border-blue-100 bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] text-blue-700">
                          {sym}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <p className="font-mono text-xs leading-relaxed text-gray-600">{chunk.preview}</p>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center font-medium text-gray-400">
          Sources and retrieved context will appear here after the first answer.
        </div>
      )}
    </div>
  );
}
