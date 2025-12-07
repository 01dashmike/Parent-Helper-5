"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/spinners/LoadingSpinner";

export interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Size variant
   */
  size?: "sm" | "default" | "lg";
  
  /**
   * Whether the button is in a loading state
   */
  loading?: boolean;
  
  /**
   * Loading text (for screen readers)
   */
  loadingLabel?: string;
  
  /**
   * Whether to show full-width button
   */
  fullWidth?: boolean;
}

/**
 * Secondary Button Component
 * 
 * Outlined button for secondary actions, maintaining visual hierarchy.
 * 
 * Features:
 * - Minimum touch target: 44x44px
 * - WCAG-compliant focus ring
 * - Loading state with spinner
 * 
 * @example
 * ```tsx
 * <SecondaryButton onClick={handleAction}>Secondary Action</SecondaryButton>
 * ```
 */
export const SecondaryButton = forwardRef<HTMLButtonElement, SecondaryButtonProps>(
  (
    {
      className,
      size = "default",
      loading = false,
      loadingLabel,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const sizeToken = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "btn-md";

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        aria-busy={loading ? "true" : undefined}
        aria-disabled={isDisabled ? "true" : undefined}
        className={cn(
          "btn btn-secondary",
          sizeToken,
          "active:bg-sage/20",
          "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" label={loadingLabel || "Loading"} />
            {children && <span className="sr-only">{loadingLabel || "Loading"}</span>}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

SecondaryButton.displayName = "SecondaryButton";

