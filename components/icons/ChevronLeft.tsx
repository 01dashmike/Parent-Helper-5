import React from "react";
import { cn } from "@/lib/utils";

export interface ChevronLeftProps {
  size?: number | string;
  className?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean | string;
}

/**
 * Chevron Left Icon
 * Used for carousel navigation and back arrows.
 */
export function ChevronLeft({
  size = 24,
  className,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden = true,
}: ChevronLeftProps) {
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
      <path d="M15 19l-7-7 7-7" />
    </svg>
  );
}

