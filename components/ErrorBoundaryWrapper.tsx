"use client";

import { ErrorBoundary } from "./ErrorBoundary";

interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Client-side wrapper for ErrorBoundary
 * Use this to wrap client components that need error boundary protection
 */
export function ErrorBoundaryWrapper({ children, fallback }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}

