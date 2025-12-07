import React from "react";
import { cn } from "@/lib/utils";

export interface CloseProps {
  size?: number | string;
  className?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean | string;
}

/**
 * Close/X Icon
 * Used for close buttons and dismiss actions.
 */
export function Close({
  size = 20,
  className,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden = true,
}: CloseProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className={cn("text-current", className)}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden !== false ? "true" : undefined}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}

