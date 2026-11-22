"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode; label?: string }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[earthcore:boundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-2xl border border-coral/30 bg-coral/5 p-5 text-sm">
          <p className="font-medium text-text">{this.props.label ?? "This module could not render."}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            The rest of EarthCore remains available. You can retry this module without reloading the
            page.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="btn btn-ghost mt-3 h-8 px-3 text-xs"
          >
            Retry module
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
