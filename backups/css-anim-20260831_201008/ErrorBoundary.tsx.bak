"use client";

import { Component, ReactNode, ErrorInfo } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ADMIN] ErrorBoundary caught:", error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    this.setState({ errorInfo });
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center bg-black/80 rounded-xl border border-red-500/20">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white font-mono mb-2">
            Something Went Wrong
          </h2>
          <p className="text-cyan-400/60 text-sm max-w-md mb-4">
            We encountered an unexpected error. Please try again or contact support if the issue persists.
          </p>
          {this.state.error && (
            <pre className="text-xs text-red-400/50 bg-black/40 p-3 rounded-lg max-w-full overflow-x-auto mb-4 border border-red-500/10">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 rounded-lg text-white font-medium transition-all shadow-lg shadow-cyan-500/20"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
