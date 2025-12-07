import React from "react";
import { cn } from "@/lib/utils";

export interface MenuProps {
  size?: number | string;
  className?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean | string;
}

/**
 * Menu/Hamburger Icon
 * Used for mobile navigation toggles.
 */
export function Menu({
  size = 20,
  className,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden = true,
}: MenuProps) {
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
      <path d="M4 6h12M4 10h12M4 14h12" />
    </svg>
  );
}

