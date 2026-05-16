type SourceListProps = {
  sources: Array<{ file_path: string; symbol_names: string[] }>;
};

export function SourceList({ sources }: SourceListProps) {
  if (!sources.length) {
    return <div className="text-sm italic text-slate-400">No specific sources referenced.</div>;
  }

  return (
    <ul className="space-y-2">
      {sources.map((source) => (
        <li key={`${source.file_path}-${source.symbol_names.join("-")}`} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
          <div className="mb-2 flex items-start justify-between gap-3">
            <strong className="min-w-0 truncate font-mono text-xs font-semibold text-slate-200" title={source.file_path}>
              {source.file_path}
            </strong>
            <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.055] px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
              {source.symbol_names.length || "file"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {source.symbol_names.length ? (
              source.symbol_names.map((symbolName) => (
                <span key={symbolName} className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] font-medium text-slate-300">
                  {symbolName}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] font-medium text-slate-500">
                entire file
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
