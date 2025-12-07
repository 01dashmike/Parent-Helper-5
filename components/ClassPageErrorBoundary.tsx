"use client";

import { ErrorBoundary } from "./ErrorBoundary";
import { Suspense } from "react";

interface ClassPageErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Error boundary wrapper specifically for class pages
 * Wraps the main content area of class pages
 */
export function ClassPageErrorBoundary({ children }: ClassPageErrorBoundaryProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-cream p-8 text-center text-charcoal">Loading class details...</div>}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

