"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorMessageProps {
  /**
   * The error message to display
   */
  error: string | Error | null | undefined;
  
  /**
   * Optional title for the error (defaults to "Error")
   */
  title?: string;
  
  /**
   * Optional retry handler function
   * If provided, a retry button will be shown
   */
  onRetry?: () => void;
  
  /**
   * Optional retry button label (defaults to "Retry")
   */
  retryLabel?: string;
  
  /**
   * Optional className for custom styling
   */
  className?: string;
  
  /**
   * Whether to show the error icon (defaults to true)
   */
  showIcon?: boolean;
  
  /**
   * Size variant (defaults to "default")
   */
  size?: "sm" | "default" | "lg";
  
  /**
   * Variant style (defaults to "default")
   */
  variant?: "default" | "inline" | "banner";
}

/**
 * Unified Error Message Component
 * 
 * Provides consistent, accessible error handling across all client components.
 * 
 * Features:
 * - role="alert" for screen readers
 * - Automatic focus management on mount
 * - Accessible retry button with aria-label
 * - Consistent styling across the application
 * - Support for different variants and sizes
 * 
 * @example
 * ```tsx
 * // Basic usage
 * {error && <ErrorMessage error={error} />}
 * 
 * // With retry
 * {error && <ErrorMessage error={error} onRetry={handleRetry} />}
 * 
 * // Custom title
 * {error && <ErrorMessage error={error} title="Failed to save" />}
 * ```
 */
export function ErrorMessage({
  error,
  title,
  onRetry,
  retryLabel = "Retry",
  className,
  showIcon = true,
  size = "default",
  variant = "default",
}: ErrorMessageProps) {
  const errorRef = useRef<HTMLDivElement>(null);

  // Extract error message
  const errorMessage = error instanceof Error ? error.message : error || "";

  // Focus the error on mount for accessibility
  useEffect(() => {
    if (errorRef.current && errorMessage) {
      errorRef.current.focus();
    }
  }, [errorMessage]);

  // Don't render if no error
  if (!errorMessage) {
    return null;
  }

  // Size classes
  const sizeClasses = {
    sm: "spacing-tight text-small",
    default: "p-3 text-small",
    lg: "spacing-body text-body",
  };

  // Variant classes
  const variantClasses = {
    default: "rounded-card border border-terracotta/30 bg-terracotta/10",
    inline: "rounded-card border border-red-200 bg-red-50",
    banner: "rounded-surface border-2 border-red-300 bg-red-50",
  };

  // Icon size mapping
  const iconSizeMap = {
    sm: iconSize.sm,
    default: iconSize.md,
    lg: iconSize.lg,
  };

  return (
    <div
      ref={errorRef}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      tabIndex={-1}
      className={cn(
        variantClasses[variant],
        sizeClasses[size],
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2",
        className
      )}
    >
      <div className="flex items-start gap-body">
        {showIcon && (
          <div className="flex-shrink-0 mt-0.5">
            <AlertCircle
              size={iconSizeMap[size]}
              className={cn(
                variant === "inline" ? "text-red-600" : "text-terracotta"
              )}
              aria-hidden="true"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h3
              className={cn(
                "font-semibold mb-xs",
                variant === "inline" ? "text-red-800" : "text-primary"
              )}
            >
              {title}
            </h3>
          )}
          <p
            className={cn(
              variant === "inline" ? "text-red-600" : "text-primary"
            )}
          >
            {errorMessage}
          </p>
          {onRetry && (
            <Button
              type="button"
              onClick={onRetry}
              size="default"
              variant={variant === "inline" ? "destructive" : "default"}
              className="mt-md gap-tight"
              aria-label={retryLabel}
            >
              <RefreshCw size={iconSize.sm} aria-hidden="true" focusable="false" />
              {retryLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

