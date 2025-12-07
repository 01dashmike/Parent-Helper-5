"use client";

import React, { Component, type ReactNode, type ErrorInfo } from "react";
import { ErrorState } from "@/components/ui/errorstate";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

/**
 * Global Error Boundary Component
 * 
 * Catches React errors anywhere in the component tree and displays
 * a fallback UI instead of crashing the entire app.
 * 
 * Features:
 * - User-friendly error display
 * - Console logging
 * - Server-side error logging via API
 * - Reset functionality
 * - Navigation options
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  override async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Generate error ID
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Log error details
    const errorDetails: {
      message: string;
      stack?: string;
      componentStack?: string;
      timestamp: string;
      userAgent: string;
      url: string;
      errorId?: string;
    } = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack || undefined,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "server",
      url: typeof window !== "undefined" ? window.location.href : "unknown",
      errorId,
    };

    // Console logging
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Error info:", errorInfo);
    console.error("[ErrorBoundary] Error ID:", errorId);
    console.error("[ErrorBoundary] Error details:", errorDetails);

    // Server-side logging
    const loggedErrorId = await this.logErrorToServer(errorDetails);
    const finalErrorId = loggedErrorId || errorId;

    // Update state with error info and error ID
    this.setState({
      error,
      errorInfo,
      errorId: finalErrorId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private async logErrorToServer(errorDetails: {
    message: string;
    stack?: string;
    componentStack?: string;
    timestamp: string;
    userAgent: string;
    url: string;
    errorId?: string;
  }): Promise<string | null> {
    try {
      // Generate error ID
      const errorId = errorDetails.errorId || `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Format error for /api/log-client-error endpoint
      const errorPayload = {
        errors: [
          {
            message: errorDetails.message,
            url: errorDetails.url,
            userAgent: errorDetails.userAgent,
            severity: "error",
            timestamp: errorDetails.timestamp,
            error: {
              name: "ErrorBoundary",
              message: errorDetails.message,
              stack: errorDetails.stack,
            },
            source: errorDetails.componentStack || undefined,
            context: {
              errorId,
              componentStack: errorDetails.componentStack,
            },
          },
        ],
      };

      const response = await fetch("/api/log-client-error", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorPayload),
      });

      if (!response.ok) {
        throw new Error(`Failed to log error: ${response.status}`);
      }

      return errorId;
    } catch (error) {
      // Silently fail - we don't want error logging to cause more errors
      console.error("[ErrorBoundary] Error logging failed:", error);
      // Return a fallback error ID even if logging failed
      return errorDetails.errorId || `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  override render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      const errorMessage = this.state.error
        ? `We're sorry, but something unexpected happened. ${this.state.errorId ? `Error ID: ${this.state.errorId}` : "Our team has been notified and is working on a fix."}`
        : "We're sorry, but something unexpected happened. Our team has been notified and is working on a fix.";

      return (
        <div className="flex min-h-screen items-center justify-center bg-surface/30 px-4 py-12">
          <div className="w-full max-w-2xl">
            <ErrorState
              title="Something went wrong"
              message={errorMessage}
              onRetry={this.handleReset}
              homeHref="/"
              size="lg"
              isDynamic={false}
            />
            
            {this.state.errorId && (
              <div className="mt-4 rounded-lg border border-accent/30 bg-surface/50 px-3 py-2 text-center" role="status">
                <p className="text-small font-medium text-primary/60 mb-1">Error ID (for support):</p>
                <p className="text-small font-mono text-accent break-all">{this.state.errorId}</p>
              </div>
            )}

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-small font-semibold text-red-800 mb-2">Error Details (Dev Only):</p>
                <p className="text-small font-mono text-red-700 mb-2">{this.state.error.message}</p>
                {this.state.error.stack && (
                  <details className="text-small font-mono text-red-600">
                    <summary 
                      className="cursor-pointer text-red-800 mb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/50 focus-visible:ring-offset-2 rounded px-1"
                    >
                      Stack Trace
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-48">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
                {this.state.errorInfo?.componentStack && (
                  <details className="text-small font-mono text-red-600 mt-2">
                    <summary 
                      className="cursor-pointer text-red-800 mb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/50 focus-visible:ring-offset-2 rounded px-1"
                    >
                      Component Stack
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-48">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

