type SourceListProps = {
  sources: Array<{ file_path: string; symbol_names: string[] }>;
};

export function SourceList({ sources }: SourceListProps) {
  if (!sources.length) {
    return <div className="text-sm text-gray-500 italic">No specific sources referenced.</div>;
  }

  return (
    <ul className="space-y-3">
      {sources.map((source) => (
        <li key={`${source.file_path}-${source.symbol_names.join("-")}`} className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
          <strong className="block text-sm font-mono text-gray-900 mb-2 truncate" title={source.file_path}>
            {source.file_path}
          </strong>
          <div className="flex flex-wrap gap-1.5">
            {source.symbol_names.length ? (
              source.symbol_names.map((symbolName) => (
                <span key={symbolName} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium font-mono bg-white border border-gray-200 text-gray-600 shadow-sm">
                  {symbolName}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium font-mono bg-gray-100 text-gray-400">
                entire file
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
