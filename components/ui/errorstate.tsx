"use client";

import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { cn } from "@/lib/utils";
import LinkComponent from "./link";

export interface ErrorStateProps {
  /**
   * Error title/heading
   */
  title?: string;
  /**
   * Error message/description
   */
  message: string;
  /**
   * Optional retry handler - if provided, shows a retry button
   */
  onRetry?: () => void;
  /**
   * Optional retry button label (defaults to "Try again")
   */
  retryLabel?: string;
  /**
   * Optional home link - if provided, shows a "Go home" button
   */
  homeHref?: string;
  /**
   * Optional home button label (defaults to "Go back home")
   */
  homeLabel?: string;
  /**
   * Optional className for custom styling
   */
  className?: string;
  /**
   * Size variant (defaults to "default")
   */
  size?: "sm" | "default" | "lg";
  /**
   * Whether to show icon (defaults to true)
   */
  showIcon?: boolean;
  /**
   * Whether this is a dynamic error that should use aria-live (defaults to true)
   */
  isDynamic?: boolean;
}

/**
 * Standardized Error State Component
 * 
 * Provides consistent, accessible error display across the application.
 * 
 * Features:
 * - Icon with aria-hidden="true"
 * - Meaningful heading
 * - Optional action buttons (retry, home)
 * - Consistent spacing and focus rings
 * - aria-live for dynamic errors
 * 
 * @example
 * ```tsx
 * {error && (
 *   <ErrorState
 *     title="Something went wrong"
 *     message="We couldn't load the classes. Please try again."
 *     onRetry={handleRetry}
 *   />
 * )}
 * ```
 */
export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  homeHref,
  homeLabel = "Go back home",
  className,
  size = "default",
  showIcon = true,
  isDynamic = true,
}: ErrorStateProps) {
  // Size classes
  const sizeClasses = {
    sm: "p-section",
    default: "p-6",
    lg: "p-8",
  };

  // Icon size mapping for AlertCircle (larger icons in wrapper)
  const iconSizeMap = {
    sm: iconSize.md,  // h-5 w-5 wrapper uses md icon
    default: iconSize.lg,  // h-6 w-6 wrapper uses lg icon
    lg: iconSize.lg,  // h-8 w-8 wrapper uses lg icon
  };

  const titleSizeClasses = {
    sm: "text-title",
    default: "text-title",
    lg: "text-title",
  };

  return (
    <div
      role="alert"
      aria-live={isDynamic ? "polite" : undefined}
      aria-atomic="true"
      className={cn(
        "flex flex-col items-center justify-center rounded-hero border border-terracotta/30 bg-white text-center shadow-soft",
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <div className="mb-md flex-shrink-0">
          <div className="rounded-full bg-terracotta/10 p-3">
            <AlertCircle
              size={iconSizeMap[size]}
              className="text-terracotta"
              aria-hidden="true"
            />
          </div>
        </div>
      )}
      
      <h2
        className={cn(
          "font-semibold text-charcoal mb-sm",
          titleSizeClasses[size]
        )}
      >
        {title}
      </h2>
      
      <p className="text-small text-text-tertiary mb-lg max-w-md">
        {message}
      </p>

      {(onRetry || homeHref) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="btn btn-sm btn-primary gap-2"
              aria-label={retryLabel}
            >
              <RefreshCw size={iconSize.sm} aria-hidden="true" />
              {retryLabel}
            </button>
          )}
          
          {homeHref && (
            <LinkComponent
              href={homeHref}
              className="btn btn-sm btn-outline gap-2 hover:bg-cream/50"
              aria-label={homeLabel}
            >
              <Home size={iconSize.sm} aria-hidden="true" />
              {homeLabel}
            </LinkComponent>
          )}
        </div>
      )}
    </div>
  );
}

