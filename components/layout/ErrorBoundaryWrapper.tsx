"use client";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { type ReactNode } from "react";

/**
 * Client-side wrapper for ErrorBoundary
 * Used to wrap server component layouts
 */
export function ErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

