import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { AskResponse, RepoInsights } from "@/api/client";
import { Button } from "@/components/atoms/Button";
import { Chip } from "@/components/atoms/Chip";
import { StatusPill } from "@/components/atoms/StatusPill";
import { StreamText } from "@/components/atoms/StreamText";
import { Icon } from "@/components/icons/Icons";
import ContextCards from "@/components/primitives/ContextCards";
import type { IndexState } from "@/components/BriefingWorkspace";
import { cn } from "@/lib/utils";

export type ChatTurn = {
  id: string;
  question: string;
  response: AskResponse | null;
  pending: boolean;
  error: string | null;
};

const DEFAULT_QUESTIONS = [
  "Where is the application entry point?",
  "How are the main modules connected?",
  "Where is configuration initialized?",
  "What should I read first?"
];

export function AskWorkspace({
  repoName,
  turns,
  loading,
  disabledReason,
  indexState,
  insights,
  onAsk
}: {
  repoName: string | null;
  turns: ChatTurn[];
  loading: boolean;
  disabledReason: string | null;
  indexState: IndexState;
  insights: RepoInsights | null;
  onAsk: (question: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const questions = insights?.suggested_questions.length
    ? insights.suggested_questions
    : DEFAULT_QUESTIONS;
  const latest = [...turns].reverse().find((turn) => turn.response)?.response ?? null;

  useEffect(() => {
    if (turns.length) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [turns]);

  const submit = (value = draft) => {
    const question = value.trim();
    if (!question || loading || disabledReason) return;
    onAsk(question);
    setDraft("");
  };

  return (
    <div className="grid min-h-[calc(100vh-8rem)] gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <section className="panel flex min-h-[38rem] min-w-0 flex-col overflow-hidden">
        <div className="panel-header shrink-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-ink text-canvas">
              <Icon name="chat" size={14} />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-[13px] font-semibold text-ink">
                {repoName ? `Interrogate ${repoName}` : "Repository interrogation"}
              </h1>
              <p className="truncate text-[11px] text-ink-3">
                Grounded answers with file paths and retrieved chunks
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <StatusPill
              tone={indexState.status === "ready" ? "green" : indexState.status === "error" ? "red" : "neutral"}
            >
              {indexState.status === "ready" ? "Index ready" : indexState.status}
            </StatusPill>
            <Chip tone="accent">grounded</Chip>
          </div>
        </div>

        <div ref={scrollRef} className="scroll-area min-h-0 flex-1 overflow-y-auto px-4 py-5">
          {!turns.length ? (
            <div className="mx-auto flex max-w-xl flex-col items-center justify-center py-14 text-center">
              <span className="flex size-12 items-center justify-center rounded-full border border-line bg-surface text-accent-ink shadow-card">
                <Icon name="sparkles" size={22} />
              </span>
              <h2 className="mt-4 text-[18px] font-semibold tracking-[-0.02em] text-ink">
                Ask the codebase, not the internet.
              </h2>
              <p className="mt-1.5 max-w-md text-[12.5px] leading-5 text-ink-2">
                Answers are grounded in indexed repository chunks. Every response includes exact
                file paths, symbols, relevance scores, and the retrieved context.
              </p>
              {disabledReason ? (
                <div className="mt-4 rounded-[9px] border border-orange/25 bg-orange-tint px-3 py-2 text-[11.5px] text-orange">
                  {disabledReason}
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap justify-center gap-1.5">
                {questions.slice(0, 5).map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => submit(question)}
                    disabled={Boolean(disabledReason) || loading}
                    className="rounded-full border border-line bg-surface px-3 py-1.5 text-[11.5px] text-ink-2 shadow-hairline transition-colors hover:bg-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-5">
              {turns.map((turn) => (
                <ChatTurnView key={turn.id} turn={turn} />
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-line bg-surface p-3">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-[13px] border border-line-strong bg-inset p-1.5 shadow-inset-field focus-within:border-accent/50">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    submit();
                  }
                }}
                placeholder={
                  disabledReason ?? (repoName ? `Ask anything about ${repoName}...` : "Analyze a repository first")
                }
                disabled={Boolean(disabledReason) || loading}
                rows={2}
                aria-label="Ask a question about the repository"
                className="max-h-40 min-h-12 w-full resize-none bg-transparent px-2.5 py-2 text-[13px] leading-6 text-ink outline-none placeholder:text-ink-3 disabled:cursor-not-allowed"
              />
              <div className="flex items-center justify-between gap-2 px-1 pb-1">
                <span className="hidden items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-3 sm:flex">
                  <Icon name="terminal" size={10} />
                  Cmd + Enter
                </span>
                <div className="flex items-center gap-1.5">
                  {draft ? (
                    <Button size="xs" variant="quiet" onClick={() => setDraft("")}>
                      Clear
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => submit()}
                    disabled={Boolean(disabledReason) || loading || !draft.trim()}
                  >
                    {loading ? <Icon name="loader" size={13} className="animate-spin" /> : <Icon name="send" size={13} />}
                    {loading ? "Thinking" : "Ask"}
                  </Button>
                </div>
              </div>
            </div>
            {indexState.message ? (
              <p className="mt-2 truncate text-center text-[10.5px] text-ink-3">{indexState.message}</p>
            ) : null}
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        {latest ? (
          <>
            <section className="panel p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-ink">Sources</h2>
                <Chip>{latest.sources.length}</Chip>
              </div>
              <SourceList sources={latest.sources} />
            </section>
            <section className="panel p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-ink">Retrieved context</h2>
                <Chip>{latest.retrieved_chunks.length}</Chip>
              </div>
              <div className="mt-3">
                <ContextCards
                  labels={{ header: "Top chunks", count: `${latest.retrieved_chunks.length} chunks` }}
                  chunks={latest.retrieved_chunks.slice(0, 5).map((chunk) => ({
                    id: `${chunk.file_path}-${chunk.chunk_index}`,
                    title: chunk.file_path.split("/").slice(-2).join("/"),
                    format: chunk.file_path.endsWith(".py") ? "PY" : "MD",
                    chars: chunk.score != null ? `${Math.round(chunk.score * 100)}% match` : undefined,
                    body: chunk.preview,
                    source: chunk.file_path,
                    tone: "bg-ink"
                  }))}
                />
              </div>
            </section>
          </>
        ) : (
          <section className="panel p-4">
            <h2 className="text-[13px] font-semibold text-ink">How answers work</h2>
            <ol className="mt-3 space-y-3">
              {[
                ["Retrieve", "The question is matched against indexed code chunks."],
                ["Ground", "The AI receives only the retrieved context, never the open web."],
                ["Cite", "Every answer returns source files, symbols, and chunk previews."]
              ].map(([title, body], index) => (
                <li key={title} className="flex gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-inset font-mono text-[10px] font-semibold text-ink-3">
                    {index + 1}
                  </span>
                  <span>
                    <strong className="block text-[11.5px] font-medium text-ink">{title}</strong>
                    <span className="text-[11px] leading-4 text-ink-3">{body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="panel p-4">
          <div className="flex items-center gap-1.5">
            <Icon name="sparkles" size={13} className="text-accent-ink" />
            <h2 className="text-[13px] font-semibold text-ink">Suggested questions</h2>
          </div>
          <div className="mt-2.5 flex flex-col gap-1">
            {questions.slice(0, 6).map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => submit(question)}
                disabled={Boolean(disabledReason) || loading}
                className="rounded-[7px] border border-line bg-inset px-2 py-1.5 text-left text-[11px] leading-4 text-ink-2 transition-colors hover:bg-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                {question}
              </button>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function ChatTurnView({ turn }: { turn: ChatTurn }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-[14px] rounded-br-[5px] border border-line bg-inset px-3.5 py-2.5 text-[12.5px] leading-5 text-ink shadow-hairline">
          {turn.question}
        </div>
      </div>

      <div className="flex gap-2.5">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-canvas">
          <Icon name="logo" size={14} />
        </span>
        <div className="min-w-0 flex-1">
          {turn.pending ? (
            <div className="rounded-[12px] border border-line bg-surface p-3.5 shadow-card">
              <div className="flex items-center gap-2 text-[12px] text-ink-2">
                <Icon name="loader" size={14} className="animate-spin text-accent" />
                Retrieving context and asking the AI...
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-2 w-11/12 animate-pulse rounded-full bg-inset" />
                <div className="h-2 w-4/5 animate-pulse rounded-full bg-inset" />
                <div className="h-2 w-2/3 animate-pulse rounded-full bg-inset" />
              </div>
            </div>
          ) : turn.error ? (
            <div className="rounded-[12px] border border-red/25 bg-red-tint p-3.5 text-[12px] leading-5 text-red">
              <div className="flex items-center gap-1.5 font-semibold">
                <Icon name="alert" size={13} />
                Answer failed
              </div>
              <p className="mt-1">{turn.error}</p>
            </div>
          ) : turn.response ? (
            <div className="overflow-hidden rounded-[12px] border border-line bg-surface shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <StatusPill tone="green" dot={false}>
                    Grounded
                  </StatusPill>
                  <Chip>{turn.response.sources.length} files</Chip>
                  <Chip>{turn.response.retrieved_chunks.length} chunks</Chip>
                </div>
                <CopyButton text={turn.response.answer} />
              </div>
              <div className="px-4 py-3.5">
                <StreamingMarkdown text={turn.response.answer} />
              </div>
              {turn.response.sources.length ? (
                <div className="border-t border-line bg-inset/50 px-3 py-2">
                  <SourceList sources={turn.response.sources} compact />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StreamingMarkdown({ text }: { text: string }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(false);
  }, [text]);

  if (done) {
    return (
      <div className="markdown-body">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="whitespace-pre-wrap text-[12.5px] leading-6 text-ink">
      <StreamText text={text} charsPerTick={7} tickMs={8} caret onDone={() => setDone(true)} />
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-[6px] px-1.5 py-1 text-[10.5px] font-medium transition-colors",
        copied ? "text-green" : "text-ink-3 hover:bg-hover hover:text-ink"
      )}
    >
      <Icon name={copied ? "check" : "copy"} size={11} />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function SourceList({
  sources,
  compact = false
}: {
  sources: Array<{ file_path: string; symbol_names: string[] }>;
  compact?: boolean;
}) {
  if (!sources.length) {
    return <p className="mt-2 text-[11px] text-ink-3">No sources returned.</p>;
  }

  return (
    <ul className={cn("flex flex-col", compact ? "gap-1" : "mt-3 gap-2")}>
      {sources.map((source) => (
        <li
          key={source.file_path}
          className="flex min-w-0 items-start gap-1.5 rounded-[7px] border border-line bg-inset/70 px-2 py-1.5"
        >
          <Icon name="file" size={11} className="mt-0.5 shrink-0 text-ink-3" />
          <div className="min-w-0 flex-1">
            <span className="block truncate font-mono text-[10.5px] text-ink" title={source.file_path}>
              {source.file_path}
            </span>
            {source.symbol_names.length ? (
              <span className="mt-0.5 block truncate text-[10px] text-ink-3">
                {source.symbol_names.join(" · ")}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
