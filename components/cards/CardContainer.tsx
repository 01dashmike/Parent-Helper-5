"use client";

import { forwardRef, ElementType } from "react";
import { cn } from "@/lib/utils";

export interface CardContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Render as a different element or component (e.g., motion.div, motion.article)
   */
  as?: ElementType;
  /**
   * Whether the card is interactive (clickable)
   */
  interactive?: boolean;
  
  /**
   * Accessible label for interactive cards
   */
  ariaLabel?: string;
  
  /**
   * Whether the card is selected/highlighted
   */
  selected?: boolean;
  
  /**
   * Variant style
   */
  variant?: "default" | "elevated" | "outlined";
  
  /**
   * Background color variant
   */
  bgVariant?: "white" | "cream";
  
  /**
   * Motion props (for framer-motion components passed via `as`)
   */
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
  whileHover?: unknown;
  whileTap?: unknown;
  whileInView?: unknown;
  viewport?: unknown;
  variants?: unknown;
  [key: string]: unknown;
}

/**
 * CardContainer Component
 * 
 * Unified card container with consistent styling and accessibility.
 * 
 * Features:
 * - Consistent border radius (rounded-2xl)
 * - Soft shadow (shadow-soft)
 * - Standardized border (border-charcoal/10)
 * - Hover/focus states with ring-sage/50
 * - role="group" for interactive cards
 * - Accessible aria-label support
 * 
 * @example
 * ```tsx
 * // Basic card
 * <CardContainer>
 *   <CardHeader>Title</CardHeader>
 *   <CardBody>Content</CardBody>
 * </CardContainer>
 * 
 * // Interactive card
 * <CardContainer 
 *   interactive 
 *   ariaLabel="View class details"
 *   onClick={handleClick}
 * >
 *   <CardBody>Clickable content</CardBody>
 * </CardContainer>
 * ```
 */
export const CardContainer = forwardRef<HTMLDivElement, CardContainerProps>(
  (
    {
      className,
      interactive = false,
      ariaLabel,
      selected = false,
      variant = "default",
      bgVariant = "white",
      as: Component = "div",
      children,
      onClick,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const baseClasses = "rounded-2xl bg-white shadow-soft p-4 border border-slate-200/60";
    
    const variantClasses: Record<string, string> = {
      default: "",
      elevated: "shadow-soft-lg",
      outlined: "border-slate-300",
    };
    
    const bgClasses: Record<string, string> = {
      white: "bg-white",
      cream: "bg-cream",
    };
    
    const interactiveClasses = interactive
      ? "cursor-pointer transition-shadow duration-200 hover:shadow-soft-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
      : "";
    
    const selectedClasses = selected
      ? "ring-2 ring-sage/50 border-sage/60 shadow-md"
      : "";

    const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
      if (interactive && onClick && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        // Create a synthetic mouse event for onClick
        const syntheticEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
        onClick(syntheticEvent as unknown as React.MouseEvent<HTMLElement>);
      }
      onKeyDown?.(event);
    };

    return (
      <Component
        ref={ref}
        role={interactive ? "button" : undefined}
        aria-label={interactive && ariaLabel ? ariaLabel : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className={cn(
          baseClasses,
          variantClasses[variant || "default"],
          bgClasses[bgVariant || "white"],
          interactiveClasses,
          selectedClasses,
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardContainer.displayName = "CardContainer";

