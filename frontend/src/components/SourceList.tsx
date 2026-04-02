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
        <li key={`${source.file_path}-${source.symbol_names.join("-")}`}>
          <strong>{source.file_path}</strong>
          <span>{source.symbol_names.length ? source.symbol_names.join(", ") : "file reference"}</span>
        </li>
      ))}
    </ul>
  );
}
