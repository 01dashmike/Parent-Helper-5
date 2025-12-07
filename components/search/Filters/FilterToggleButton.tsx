"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/motion/tokens";

interface FilterToggleButtonProps {
  /** Whether the filter is currently active/selected */
  isActive: boolean;
  /** Label text for the filter */
  label: string;
  /** Optional icon or emoji to display */
  icon?: React.ReactNode;
  /** Click handler */
  onClick: () => void;
  /** Optional animation delay for staggered entrance */
  animationDelay?: number;
  /** Optional index for animation */
  index?: number;
  /** Additional className */
  className?: string;
  /** aria-label override (defaults to dynamic label based on isActive) */
  ariaLabel?: string;
}

/**
 * Standardized toggle button for filter UIs
 * Ensures consistent styling, aria-pressed, and behavior across all filter buttons
 * Note: onClick callback should be stable (useCallback) for optimal performance
 */
export const FilterToggleButton = memo(function FilterToggleButton({
  isActive,
  label,
  icon,
  onClick,
  animationDelay = 0,
  index = 0,
  className,
  ariaLabel,
}: FilterToggleButtonProps) {
  const defaultAriaLabel = useMemo(() => 
    `${isActive ? "Remove" : "Apply"} ${label} filter`,
    [isActive, label]
  );

  return (
    <motion.button
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: animationDelay || index * 0.05, duration: motionTokens.medium }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      aria-pressed={isActive}
      aria-label={ariaLabel || defaultAriaLabel}
      className={cn(
        "shrink-0 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-small font-medium",
        // WCAG minimum touch target: 44px x 44px
        "min-h-[44px] min-w-[44px]",
        "motion-safe:transition-all motion-safe:duration-200",
        "motion-reduce:transition-none motion-reduce:animate-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2",
        // Selected state
        isActive
          ? "bg-accent text-white border-accent shadow-sm ring-2 ring-sage/30"
          : "border-accent/20 bg-white text-primary hover:bg-surface hover:border-accent/40",
        className
      )}
    >
      {icon && (
        <motion.span
          aria-hidden="true"
          animate={isActive ? { rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: motionTokens.slow }}
        >
          {icon}
        </motion.span>
      )}
      <span>{label}</span>
    </motion.button>
  );
});

