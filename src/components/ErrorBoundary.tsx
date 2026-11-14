import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Smart Chief page error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="container mx-auto px-4 py-16 text-center" role="alert">
          <h1 className="text-3xl font-bold">Something went wrong</h1>
          <p className="mt-3 text-muted-foreground">This page could not be displayed. Reload to try again.</p>
          <button type="button" className="mt-6 rounded-lg bg-primary px-5 py-3 text-primary-foreground" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
