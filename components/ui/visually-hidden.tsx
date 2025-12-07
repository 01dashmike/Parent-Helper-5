import * as React from "react";
import { cn } from "@/lib/utils";

export interface VisuallyHiddenProps extends Omit<React.HTMLAttributes<HTMLElement>, "as"> {
  as?: keyof JSX.IntrinsicElements;
  children: React.ReactNode;
  // Allow label-specific props
  htmlFor?: string;
}

/**
 * VisuallyHidden component for screen reader only text
 * Hides content visually but keeps it accessible to assistive technologies
 */
export const VisuallyHidden = React.forwardRef<HTMLElement, VisuallyHiddenProps>(
  ({ as: Component = "span", className, children, htmlFor, ...props }, ref) => {
    return React.createElement(
      Component,
      {
        ref,
        className: cn("sr-only", className),
        ...(htmlFor && { htmlFor }),
        ...props,
      },
      children
    );
  }
);

VisuallyHidden.displayName = "VisuallyHidden";

