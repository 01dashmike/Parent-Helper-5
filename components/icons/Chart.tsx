import React from "react";
import { cn } from "@/lib/utils";

export interface ChartProps {
  size?: number | string;
  className?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean;
}

/**
 * Chart/Trend Icon
 * Used for analytics, trends, and growth metrics.
 */
export function Chart({
  size = 24,
  className,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden = true,
}: ChartProps) {
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
      <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

