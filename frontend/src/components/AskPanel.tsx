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
  const sourceCount = response?.sources.length ?? 0;
  const chunkCount = response?.retrieved_chunks.length ?? 0;

  const submit = () => {
    const nextQuestion = question.trim();
    if (!nextQuestion || disabled || loading) {
      return;
    }
    onAsk(nextQuestion);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="min-w-0 space-y-5">
        <section className="premium-panel p-5">
          <div className="relative">
            <textarea
              className="min-h-[132px] w-full resize-none rounded-2xl border border-white/10 bg-black/55 p-4 pr-32 text-sm text-slate-100 shadow-inner outline-none transition-all placeholder:text-slate-600 focus:border-white/25 focus:bg-black/75 focus:ring-4 focus:ring-white/5"
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
              <span className="hidden font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:inline">Cmd+Enter</span>
              <button
                className="btn-primary h-9 px-4 text-sm"
                disabled={disabled || loading || !question.trim()}
                onClick={submit}
                type="button"
              >
                {loading ? "..." : "Ask"}
              </button>
            </div>
          </div>

          {error && <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm font-medium text-red-200">{error}</div>}
          {disabled && disabledReason ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-sm font-medium text-slate-500">{disabledReason}</div>
          ) : null}
          {statusMessage && !response && !loading && !error && !disabled && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm font-medium text-slate-300">{statusMessage}</div>
          )}

          {!response && !loading && !disabled && (
            <div className="mt-4 flex flex-wrap gap-2">
              {sampleQuestions.map((item) => (
                <button
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-semibold text-slate-400 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
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
        </section>

        <section className="premium-panel min-h-[24rem] p-6">
          {loading ? (
            <div className="flex min-h-[20rem] flex-col justify-center space-y-4">
              <div className="h-2 w-28 rounded-full bg-white signal-pulse" />
              <div className="h-5 w-2/3 rounded-full bg-white/10" />
              <div className="h-5 w-1/2 rounded-full bg-white/10" />
              <div className="h-24 rounded-2xl border border-white/10 bg-white/[0.04]" />
              <div className="font-semibold text-slate-500">Searching indexed files...</div>
            </div>
          ) : response ? (
            <div className="prose max-w-none">
              <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
                <span className="rounded-full border border-white bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-black">Response</span>
                <span className="font-mono text-xs text-slate-500">{response.repo_name}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.055] px-2 py-1 font-mono text-[10px] text-slate-500">{sourceCount} sources</span>
                <span className="rounded-full border border-white/10 bg-white/[0.055] px-2 py-1 font-mono text-[10px] text-slate-500">{chunkCount} chunks</span>
              </div>
              <ReactMarkdown>{response.answer}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex min-h-[20rem] flex-col justify-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] font-mono text-sm font-bold text-slate-500 shadow-sm">
                QA
              </div>
              <p className="max-w-md text-sm font-semibold leading-6 text-slate-500">
                Ask a question to receive a grounded answer with explicit source files and retrieved chunks.
              </p>
            </div>
          )}
        </section>
      </div>

      <aside className="space-y-5">
        {response ? (
          <>
            <section className="premium-panel p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Sources</h3>
                <span className="font-mono text-xs text-slate-400">{sourceCount}</span>
              </div>
              <SourceList sources={response.sources} />
            </section>

            <section className="premium-panel p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Context</h3>
                <span className="font-mono text-xs text-slate-400">{visibleChunks.length}</span>
              </div>
              <ul className="space-y-3">
                {visibleChunks.map((chunk) => (
                  <li key={`${chunk.file_path}-${chunk.chunk_index}`} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                    <div className="mb-2 flex items-baseline justify-between gap-2 border-b border-white/10 pb-2">
                      <strong className="truncate font-mono text-xs text-slate-200" title={chunk.file_path}>{chunk.file_path}</strong>
                      <span className="shrink-0 font-mono text-[10px] text-slate-400">#{chunk.chunk_index}</span>
                    </div>
                    {chunk.symbol_names.length ? (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {chunk.symbol_names.map((sym) => (
                          <span key={sym} className="rounded-full border border-white/10 bg-white/[0.055] px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                            {sym}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <p className="font-mono text-[11px] leading-5 text-slate-500">{chunk.preview}</p>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : (
          <section className="premium-panel flex min-h-[16rem] flex-col justify-center p-5">
            <h3 className="text-sm font-bold text-white">Evidence rail</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Sources and retrieved context will appear here after the first answer.</p>
          </section>
        )}
      </aside>
    </div>
  );
}
