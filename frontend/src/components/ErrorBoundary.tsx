import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("RepoSketch UI crashed", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-page p-6 text-ink">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-card">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-red">
              Workspace error
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight">
              The interface hit an unexpected error.
            </h1>
            <p className="mt-2 text-sm leading-6 text-ink-2">
              Your repository data is still on the server. Reload the workspace and try again.
            </p>
            <pre className="scroll-area mt-4 max-h-40 overflow-auto rounded-lg border border-line bg-inset p-3 font-mono text-[11px] leading-5 text-ink-2">
              {this.state.error.message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex h-9 items-center rounded-full bg-ink px-4 text-sm font-medium text-canvas"
            >
              Reload workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
