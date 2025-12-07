"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  /**
   * Size of the spinner. Defaults to "default"
   */
  size?: "sm" | "default" | "lg";
  /**
   * Additional className for styling
   */
  className?: string;
  /**
   * Text to display next to the spinner for screen readers
   */
  label?: string;
}

/**
 * Unified LoadingSpinner component for consistent loading states across the app.
 * 
 * Features:
 * - Accessible: Uses aria-hidden on icon, provides screen reader text
 * - Consistent: Standardized appearance across all loading states
 * - Flexible: Supports multiple sizes and custom styling
 */
export function LoadingSpinner({ 
  size = "default", 
  className = "",
  label = "Loading"
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-6 w-6",
  };

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Loader2 
        className={`animate-spin ${sizeClasses[size]}`}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

