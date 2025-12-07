"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/spinners/LoadingSpinner";

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  /**
   * Icon component to display
   */
  icon: React.ReactNode;
  
  /**
   * Accessible label (required for icon-only buttons)
   */
  "aria-label": string;
  
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
   * Visual variant
   */
  variant?: "default" | "outline" | "ghost";
}

/**
 * Icon Button Component
 * 
 * WCAG AA compliant icon-only button with consistent styling.
 * 
 * Features:
 * - Minimum touch target: 44x44px
 * - Required aria-label for accessibility
 * - WCAG-compliant focus ring
 * - Loading state with spinner
 * 
 * @example
 * ```tsx
 * <IconButton
 *   icon={<X />}
 *   aria-label="Close dialog"
 *   onClick={handleClose}
 * />
 * ```
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      icon,
      "aria-label": ariaLabel,
      size = "default",
      loading = false,
      loadingLabel,
      variant = "default",
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const sizeClasses = {
      sm: "min-h-[44px] min-w-[44px] p-2",
      default: "min-h-[44px] min-w-[44px] p-2.5",
      lg: "min-h-[44px] min-w-[44px] p-3",
    };

    const variantClasses = {
      default: "bg-accent text-white hover:bg-accent/90 active:bg-accent/80",
      outline: "border border-accent/30 bg-transparent text-accent hover:bg-accent/10 hover:border-accent/40 active:bg-accent/20",
      ghost: "bg-transparent text-primary hover:bg-accent/10 active:bg-accent/20",
    };

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        aria-label={loading ? loadingLabel || ariaLabel : ariaLabel}
        aria-busy={loading ? "true" : undefined}
        aria-disabled={isDisabled ? "true" : undefined}
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          "transition-standard",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {loading ? (
          <LoadingSpinner size="sm" label={loadingLabel || ariaLabel} />
        ) : (
          icon
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

