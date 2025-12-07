import React from "react";
import { cn } from "@/lib/utils";

export interface SearchProps {
  size?: number | string;
  className?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean;
}

/**
 * Search Icon
 * Used for search inputs and search functionality.
 */
export function Search({
  size = 24,
  className,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden = true,
}: SearchProps) {
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
      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

