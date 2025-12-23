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
        // Base styles
        "shrink-0 inline-flex items-center gap-2 rounded-2xl border-2 px-5 py-2.5 text-small font-semibold",
        // WCAG minimum touch target: 44px x 44px
        "min-h-[44px] min-w-[44px]",
        // Smooth transitions
        "motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out",
        "motion-reduce:transition-none motion-reduce:animate-none",
        // Focus state
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2",
        // Selected/Active state - cream with darker border
        isActive
          ? "bg-cream text-sage-dark border-sage-dark shadow-lg shadow-sage/30 ring-2 ring-sage/40"
          : [
              // Inactive state - vibrant sage green
              "border-sage bg-sage text-white shadow-md shadow-sage/25",
              // Hover state - transition to cream
              "hover:border-sage-dark hover:bg-cream hover:text-sage-dark hover:shadow-lg hover:shadow-sage/30",
            ],
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

