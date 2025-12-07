import React from "react";
import { cn } from "@/lib/utils";

export interface CheckProps {
  size?: number | string;
  className?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean;
}

/**
 * Check Icon
 * Used for confirmation, success states, and checkmarks.
 */
export function Check({
  size = 24,
  className,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden = true,
}: CheckProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("text-current", className)}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden !== false ? "true" : undefined}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

