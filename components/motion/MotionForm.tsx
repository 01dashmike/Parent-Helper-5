"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { useMotion } from "@/lib/hooks/useMotion";
import { cn } from "@/lib/utils";

export interface MotionFormProps extends Omit<HTMLMotionProps<"form">, "initial" | "animate" | "transition"> {
  /**
   * Animation type to apply
   */
  animation?: "fadeIn" | "scaleIn" | "slideUp";
  /**
   * Delay in seconds
   */
  delay?: number;
  /**
   * Duration in seconds
   */
  duration?: number;
  /**
   * Starting scale for scale animations
   */
  fromScale?: number;
  /**
   * Additional className
   */
  className?: string;
}

/**
 * MotionForm - Animated form element with reduced-motion support
 */
export const MotionForm = forwardRef<HTMLFormElement, MotionFormProps>(
  ({ animation = "scaleIn", delay = 0, duration = 0.4, fromScale = 0.97, className, children, ...props }, ref) => {
    const { scaleIn, fadeIn, slideUp } = useMotion();

    let config;
    if (animation === "fadeIn") {
      config = fadeIn(delay, duration);
    } else if (animation === "scaleIn") {
      config = scaleIn(delay, duration, fromScale);
    } else {
      config = slideUp(delay, duration);
    }

    return (
      <motion.form
        ref={ref}
        {...({
          initial: config.initial,
          animate: config.animate,
          transition: config.transition,
          className: cn(className),
          ...props
        } as React.ComponentProps<typeof motion.form>)}
      >
        {children}
      </motion.form>
    );
  }
);

MotionForm.displayName = "MotionForm";

