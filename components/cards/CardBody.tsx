import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Padding variant
   */
  padding?: "none" | "sm" | "default" | "lg";
}

/**
 * CardBody Component
 * 
 * Main content section for cards with consistent padding.
 * 
 * @example
 * ```tsx
 * <CardBody>
 *   <p>Card content goes here</p>
 * </CardBody>
 * ```
 */
export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, padding = "default", children, ...props }, ref) => {
    const paddingClasses = {
      none: "",
      sm: "p-4",
      default: "p-4",
      lg: "p-6",
    };

    return (
      <div
        ref={ref}
        className={cn(paddingClasses[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardBody.displayName = "CardBody";

