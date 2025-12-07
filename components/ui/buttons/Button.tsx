"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/spinners/LoadingSpinner";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Size variant
   */
  size?: "sm" | "default" | "lg" | "icon";

  /**
   * Visual variant
   */
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | string;
  
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
 * Primary Button Component
 * 
 * WCAG AA compliant button with consistent styling and loading states.
 * 
 * Features:
 * - Minimum touch target: 44x44px
 * - WCAG-compliant focus ring
 * - Loading state with spinner and aria-busy
 * - Disabled state handling
 * 
 * @example
 * ```tsx
 * <Button onClick={handleClick}>Click me</Button>
 * <Button loading loadingLabel="Saving...">Save</Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
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
          "btn btn-primary",
          sizeToken,
          "active:bg-sage/80",
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

Button.displayName = "Button";

