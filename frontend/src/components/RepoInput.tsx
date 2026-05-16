import type { FormEvent } from "react";

type RepoInputProps = {
  repoUrl: string;
  loading: boolean;
  statusText: string | null;
  repoName: string | null;
  indexStatus: "idle" | "indexing" | "ready" | "error";
  onChange: (value: string) => void;
  onSubmit: () => void;
};

const sampleRepos = [
  "https://github.com/pallets/click",
  "https://github.com/tiangolo/fastapi",
  "https://github.com/pydantic/pydantic"
];

const capabilities = ["AST map", "Dependency graph", "Grounded Q&A"];
const promptChips = ["Find the entry point", "Explain service boundaries", "Map API routes"];

export function RepoInput({
  repoUrl,
  loading,
  statusText,
  repoName,
  indexStatus,
  onChange,
  onSubmit
}: RepoInputProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <div className="relative w-full text-white">
      <section className="relative mx-auto flex min-h-[calc(100vh-13rem)] w-full max-w-5xl flex-col items-center justify-center overflow-hidden px-3 pb-12 pt-8 text-center md:pt-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[16%] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-white/[0.035] blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-black via-black/90 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/85 to-transparent" />
        </div>

        <div className="relative z-10 flex w-full flex-col items-center">
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-slate-300 shadow-[0_18px_60px_-44px_rgba(255,255,255,0.5)] backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-white signal-pulse" />
            {repoName ? `${repoName} loaded` : "Repository intelligence"}
          </div>

          <h1 className="animate-fade-up mt-7 max-w-4xl text-5xl font-extrabold leading-[0.98] tracking-normal text-white md:text-6xl lg:text-7xl">
            Type what you need to know.
          </h1>

          <p className="animate-fade-up-delay mt-5 max-w-2xl text-base leading-8 text-slate-400 md:text-lg">
            From{" "}
            <span className="rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1 text-slate-200 sm:whitespace-nowrap">
              where is the API entry point?
            </span>{" "}
            to{" "}
            <span className="rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1 text-slate-200 sm:whitespace-nowrap">
              explain the service graph
            </span>
            , RepoSketch turns a codebase into diagrams, source context, and grounded answers.
          </p>

          <form onSubmit={handleSubmit} className="animate-fade-up-delay mt-9 w-full max-w-[46rem]">
            <div className="rounded-[2rem] border border-white/[0.16] bg-[#232327]/80 p-2 shadow-[0_30px_110px_-62px_rgba(255,255,255,0.58)] backdrop-blur-2xl">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  className="min-h-14 min-w-0 flex-1 rounded-full border border-white/10 bg-black/70 px-5 text-center font-mono text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600 focus:border-white/25 focus:bg-black sm:text-left"
                  placeholder="https://github.com/owner/repo"
                  value={repoUrl}
                  disabled={loading}
                  onChange={(e) => onChange(e.target.value)}
                />
                <button
                  type="submit"
                  className="inline-flex min-h-14 items-center justify-center rounded-full bg-white px-8 text-sm font-black text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading || !repoUrl.trim()}
                >
                  {loading ? "Analyzing" : "Start analysis"}
                </button>
              </div>
            </div>
          </form>

          <div className="relative z-20 mt-5 flex flex-wrap items-center justify-center gap-2 px-3">
            {promptChips.map((prompt) => (
              <span
                key={prompt}
                className="rounded-full border border-dashed border-white/12 bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-slate-400"
              >
                {prompt}
              </span>
            ))}
          </div>

          <div className="relative z-20 mt-3 flex flex-wrap items-center justify-center gap-2 px-3">
            {sampleRepos.map((repo) => (
              <button
                key={repo}
                type="button"
                onClick={() => onChange(repo)}
                className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 font-mono text-xs font-medium text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              >
                {repo.replace("https://github.com/", "")}
              </button>
            ))}
          </div>

          <div className="relative z-20 mt-7 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-500">
            {capabilities.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5">
                {item}
              </span>
            ))}
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5">
              {indexStatus === "idle" ? "Awaiting index" : indexStatus}
            </span>
          </div>

          {statusText ? (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-slate-200 backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-white signal-pulse" />
              {statusText}
            </div>
          ) : null}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-6xl px-3 pb-24 pt-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-extrabold leading-tight tracking-normal text-white md:text-6xl">
            See the repo take shape.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-500 md:text-lg">
            One link becomes structure, diagrams, and source-grounded answers without leaving the workspace.
          </p>
        </div>

        <div className="relative mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_38px_150px_-88px_rgba(255,255,255,0.42)] md:rounded-[2.4rem]">
          <div className="aspect-[16/9] min-h-[22rem] w-full md:min-h-[34rem]">
            <video
              className="h-full w-full object-cover opacity-85"
              src="/media/hands-typing.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="Hands typing on a keyboard"
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,transparent_0,transparent_18rem,rgba(0,0,0,0.34)_34rem),linear-gradient(180deg,rgba(0,0,0,0.14)_0%,rgba(0,0,0,0.22)_56%,rgba(0,0,0,0.7)_100%)]" />
          <div className="absolute bottom-5 left-1/2 flex w-[calc(100%-2.5rem)] max-w-3xl -translate-x-1/2 flex-wrap items-center justify-center gap-2">
            {promptChips.map((prompt) => (
              <span
                key={prompt}
                className="rounded-full border border-white/12 bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-slate-300 backdrop-blur-xl"
              >
                {prompt}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
