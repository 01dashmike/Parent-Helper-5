"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to add bottom border separator
   */
  withBorder?: boolean;
}

/**
 * CardHeader Component
 * 
 * Header section for cards with consistent padding and styling.
 * 
 * @example
 * ```tsx
 * <CardHeader>
 *   <h3>Card Title</h3>
 * </CardHeader>
 * ```
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, withBorder = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "px-6 py-4",
          withBorder && "border-b border-charcoal/10",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

