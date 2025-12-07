"use client";

import { ErrorBoundary } from "./ErrorBoundary";

interface DashboardErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Error boundary wrapper for dashboard pages
 */
export function DashboardErrorBoundary({ children }: DashboardErrorBoundaryProps) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}

