import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Icon } from "@/components/icons/Icons";
import LoadingState from "@/components/primitives/LoadingState";

const SAMPLES = [
  { label: "pallets/click", url: "https://github.com/pallets/click" },
  { label: "tiangolo/fastapi", url: "https://github.com/tiangolo/fastapi" },
  { label: "pydantic/pydantic", url: "https://github.com/pydantic/pydantic" }
];

const CAPABILITIES = [
  { icon: "network" as const, label: "AST + dependency map" },
  { icon: "sparkles" as const, label: "AI architecture briefing" },
  { icon: "database" as const, label: "Grounded file Q&A" }
];

export function RepoInput({
  loading,
  statusText,
  indexStatus,
  onAnalyze
}: {
  loading: boolean;
  statusText: string | null;
  indexStatus: "idle" | "indexing" | "ready" | "error";
  onAnalyze: (url: string) => void;
}) {
  const [repoUrl, setRepoUrl] = useState("");

  return (
    <div className="space-y-4">
      <section className="hero-surface px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="kicker">
            <span className="size-1.5 rounded-full bg-green" />
            Repository intelligence
          </span>
          <StatusPill tone={indexStatus === "ready" ? "green" : indexStatus === "error" ? "red" : "neutral"}>
            {indexStatus === "idle" ? "Ready to analyze" : indexStatus}
          </StatusPill>
        </div>

        <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-ink md:text-6xl">
          Understand any repo
          <span className="block text-gradient">before you open it.</span>
        </h1>
        <p className="mt-4 max-w-xl text-[14px] leading-6 text-ink-2 md:text-[15px]">
          Paste a GitHub URL. RepoSketch clones it, maps the architecture, indexes the code,
          and answers questions with exact file references — with no billing setup required.
        </p>

        <form
          className="mt-7 w-full max-w-2xl"
          onSubmit={(event) => {
            event.preventDefault();
            if (repoUrl.trim() && !loading) onAnalyze(repoUrl.trim());
          }}
        >
          <div className="rounded-[16px] border border-line-strong bg-surface p-1.5 shadow-raised">
            <div className="flex flex-col gap-1.5 sm:flex-row">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[12px] bg-inset px-3 shadow-inset-field">
                <Icon name="github" size={16} className="shrink-0 text-ink-3" />
                <input
                  value={repoUrl}
                  onChange={(event) => setRepoUrl(event.target.value)}
                  placeholder="https://github.com/owner/project"
                  className="h-11 min-w-0 flex-1 bg-transparent font-mono text-[13px] text-ink outline-none placeholder:text-ink-3"
                  disabled={loading}
                  aria-label="GitHub repository URL"
                />
              </div>
              <Button type="submit" size="lg" variant="primary" disabled={loading || !repoUrl.trim()}>
                {loading ? <Icon name="loader" size={15} className="animate-spin" /> : <Icon name="sparkles" size={15} />}
                {loading ? "Analyzing" : "Start analysis"}
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          <span className="mr-1 text-[11px] text-ink-3">Try</span>
          {SAMPLES.map((sample) => (
            <button
              key={sample.url}
              type="button"
              onClick={() => setRepoUrl(sample.url)}
              className="rounded-full border border-line bg-surface px-2.5 py-1 font-mono text-[10.5px] text-ink-2 shadow-hairline transition-colors hover:bg-hover hover:text-ink"
            >
              {sample.label}
            </button>
          ))}
        </div>

        {loading || statusText ? (
          <div className="mt-6 flex w-full max-w-lg items-center gap-3 rounded-[12px] border border-line bg-surface px-3.5 py-3 text-left shadow-card">
            <LoadingState
              variant="Dots"
              label={statusText ?? "Waking the backend and cloning the repository..."}
            />
            <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
              live
            </span>
          </div>
        ) : null}

        <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-3">
          {CAPABILITIES.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 rounded-[10px] border border-line bg-surface/70 px-3 py-2.5 text-left shadow-hairline"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-accent-tint text-accent-ink">
                <Icon name={item.icon} size={14} />
              </span>
              <span className="text-[11.5px] font-medium leading-4 text-ink-2">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <article className="panel p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[12px] font-semibold text-ink">Architecture map</h2>
            <Icon name="network" size={14} className="text-ink-3" />
          </div>
          <div className="mt-3 rounded-[9px] border border-line bg-inset/60 p-3">
            <div className="mx-auto h-5 w-20 rounded-[4px] border border-accent/30 bg-accent-tint" />
            <div className="mx-auto h-3 w-px bg-line-strong" />
            <div className="grid grid-cols-3 gap-2">
              {["api", "core", "utils"].map((label) => (
                <div key={label} className="rounded-[4px] border border-line bg-surface px-1.5 py-1 text-center font-mono text-[9px] text-ink-2">
                  {label}
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between px-2">
              {[0, 1, 2].map((index) => (
                <span key={index} className="h-3 w-px bg-line" />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["routes.py", "models.py", "config.py"].map((label) => (
                <div key={label} className="rounded-[4px] border border-line bg-surface px-1 py-0.5 text-center font-mono text-[8px] text-ink-3">
                  {label}
                </div>
              ))}
            </div>
          </div>
          <p className="mt-2.5 text-[11px] leading-4 text-ink-3">
            Parse the file tree and AST imports into three interactive Mermaid views.
          </p>
        </article>

        <article className="panel p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[12px] font-semibold text-ink">AI briefing</h2>
            <Icon name="sparkles" size={14} className="text-ink-3" />
          </div>
          <div className="mt-3 rounded-[9px] border border-line bg-inset/60 p-3">
            <div className="flex items-center gap-1.5">
              <span className="rounded-[4px] bg-accent-tint px-1.5 py-0.5 font-mono text-[8px] text-accent-ink">
                AI briefing
              </span>
              <span className="text-[8px] text-ink-3">cached</span>
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-line-strong/70" />
              <div className="h-1.5 w-11/12 rounded-full bg-line-strong/70" />
              <div className="h-1.5 w-4/5 rounded-full bg-line-strong/70" />
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {["src/main.py", "api/routes.py"].map((file) => (
                <span key={file} className="rounded-[3px] border border-line bg-surface px-1 py-0.5 font-mono text-[8px] text-ink-2">
                  {file}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-2.5 text-[11px] leading-4 text-ink-3">
            Get an overview, architecture notes, entry points, risks, and next questions.
          </p>
        </article>

        <article className="panel p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[12px] font-semibold text-ink">Grounded answers</h2>
            <Icon name="chat" size={14} className="text-ink-3" />
          </div>
          <div className="mt-3 rounded-[9px] border border-line bg-inset/60 p-3">
            <div className="ml-auto w-fit max-w-[90%] rounded-[7px] rounded-br-[2px] bg-surface px-2 py-1 text-[9px] text-ink-2 shadow-hairline">
              Where is auth configured?
            </div>
            <div className="mt-2 flex gap-1.5">
              <span className="mt-0.5 size-3.5 shrink-0 rounded-full bg-ink" />
              <div className="min-w-0 flex-1 rounded-[7px] rounded-tl-[2px] border border-line bg-surface px-2 py-1.5">
                <div className="space-y-1">
                  <div className="h-1 w-full rounded-full bg-line-strong/60" />
                  <div className="h-1 w-10/12 rounded-full bg-line-strong/60" />
                </div>
                <div className="mt-1.5 flex gap-1">
                  <span className="rounded-[3px] bg-accent-tint px-1 py-0.5 font-mono text-[7px] text-accent-ink">auth.py</span>
                  <span className="rounded-[3px] bg-green-tint px-1 py-0.5 font-mono text-[7px] text-green">94%</span>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-2.5 text-[11px] leading-4 text-ink-3">
            Every answer cites files, symbols, relevance scores, and retrieved chunks.
          </p>
        </article>
      </section>
    </div>
  );
}
