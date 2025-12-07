"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to add top border separator
   */
  withBorder?: boolean;
}

/**
 * CardFooter Component
 * 
 * Footer section for cards with consistent padding and styling.
 * 
 * @example
 * ```tsx
 * <CardFooter withBorder>
 *   <button>Action</button>
 * </CardFooter>
 * ```
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, withBorder = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "px-6 py-4",
          withBorder && "border-t border-charcoal/10",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";

