type SourceListProps = {
  sources: Array<{ file_path: string; symbol_names: string[] }>;
};

export function SourceList({ sources }: SourceListProps) {
  if (!sources.length) {
    return <div className="placeholder-card compact">Source references will appear here.</div>;
  }

  return (
    <ul className="source-list">
      {sources.map((source) => (
        <li key={`${source.file_path}-${source.symbol_names.join("-")}`} className="source-card">
          <strong className="source-path">{source.file_path}</strong>
          <div className="source-pill-row">
            {source.symbol_names.length ? (
              source.symbol_names.map((symbolName) => (
                <span key={symbolName} className="source-symbol">
                  {symbolName}
                </span>
              ))
            ) : (
              <span className="source-symbol muted">file reference</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
