import React from "react";
import { cn } from "@/lib/utils";

export interface ChevronDownProps {
  size?: number | string;
  className?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean | string;
  focusable?: boolean | string;
}

/**
 * Chevron Down Icon
 * Used for dropdown arrows and expandable content indicators.
 */
export function ChevronDown({
  size = 12,
  className,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden = true,
}: ChevronDownProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      width={size}
      height={size}
      className={cn("text-current", className)}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden !== false ? "true" : undefined}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 4.5L6 8l4-3.5" />
    </svg>
  );
}

