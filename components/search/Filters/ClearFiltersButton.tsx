"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ClearFiltersButtonProps {
  /** Click handler */
  onClick: () => void;
  /** Optional label text (defaults to "Clear all") */
  label?: string;
  /** Additional className */
  className?: string;
  /** Optional animation props */
  initial?: { opacity: number; scale: number };
  animate?: { opacity: number; scale: number };
  exit?: { opacity: number; scale: number };
}

/**
 * Standardized button for clearing/resetting filters
 * Ensures consistent styling and behavior across all filter UIs
 */
export function ClearFiltersButton({
  onClick,
  label = "Clear all",
  className,
  initial = { opacity: 0, scale: 0.8 },
  animate = { opacity: 1, scale: 1 },
  exit = { opacity: 0, scale: 0.8 },
}: ClearFiltersButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={initial}
      animate={animate}
      exit={exit}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "shrink-0 rounded-xl border border-accent/20 bg-white px-3 py-2 text-small font-medium text-primary",
        // WCAG minimum touch target: 44px x 44px
        "min-h-[44px] min-w-[44px]",
        "motion-safe:transition-all motion-safe:duration-200",
        "motion-reduce:transition-none motion-reduce:animate-none",
        "hover:bg-surface hover:border-accent/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2",
        "sm:self-center",
        className
      )}
      aria-label={`${label} filters`}
    >
      {label}
    </motion.button>
  );
}

