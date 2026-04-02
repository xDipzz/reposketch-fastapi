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

const capabilityCards = [
  {
    label: "AST parser",
    value: "Python-native structure"
  },
  {
    label: "Mermaid",
    value: "Architecture snapshots"
  },
  {
    label: "Grounded RAG",
    value: "Source-backed answers"
  }
];

export function RepoInput({
  repoUrl,
  loading,
  statusText,
  onChange,
  onSubmit
}: RepoInputProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 mb-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          Understand any Python codebase in seconds.
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Paste a repository URL below. RepoSketch will analyze its structure, generate architecture diagrams, and build a grounded Q&A index.
        </p>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex items-center gap-3">
            <input
              type="text"
              className="input-field text-lg py-3 flex-1 text-center font-mono placeholder-gray-400"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              disabled={loading}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
          <div className="mt-4">
            <button
              type="submit"
              className="btn-primary text-lg px-8 py-3 w-full sm:w-auto"
              disabled={loading || !repoUrl.trim()}
            >
              {loading ? "Analyzing..." : "Start Analysis"}
            </button>
          </div>
        </form>

        <div className="text-sm text-gray-500 mb-4 font-semibold uppercase tracking-wider">Or try a sample repository</div>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {sampleRepos.map((repo) => (
            <button
              key={repo}
              type="button"
              onClick={() => onChange(repo)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              {repo.replace("https://github.com/", "")}
            </button>
          ))}
        </div>

        {statusText ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 font-medium">
            <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {statusText}
          </div>
        ) : null}
      </div>

      <div className="grid sm:grid-cols-3 gap-6 mt-12 pt-8 border-t border-gray-100">
        {capabilityCards.map((card) => (
          <div key={card.label} className="text-center">
            <div className="text-gray-900 font-bold mb-1">{card.value}</div>
            <div className="text-gray-500 text-sm font-medium uppercase tracking-wider">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
