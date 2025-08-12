import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center text-center p-4">
            <div>
                <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
                <h1 className="text-2xl font-bold">Oops! Something went wrong.</h1>
                <p className="text-muted-foreground mt-2">
                    We've been notified of the issue. Please try refreshing the page.
                </p>
                <Button onClick={() => window.location.reload()} className="mt-6">
                    Refresh Page
                </Button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;