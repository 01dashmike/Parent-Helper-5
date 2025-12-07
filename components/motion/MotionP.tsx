"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { useMotion } from "@/lib/hooks/useMotion";
import { cn } from "@/lib/utils";

export interface MotionPProps extends Omit<HTMLMotionProps<"p">, "initial" | "animate" | "transition"> {
  /**
   * Animation type to apply
   */
  animation?: "fadeIn" | "slideUp" | "fadeInSlideUp";
  /**
   * Delay in seconds
   */
  delay?: number;
  /**
   * Duration in seconds
   */
  duration?: number;
  /**
   * Distance for slide animations (in pixels)
   */
  distance?: number;
  /**
   * Additional className
   */
  className?: string;
}

/**
 * MotionP - Animated p element with reduced-motion support
 */
export const MotionP = forwardRef<HTMLParagraphElement, MotionPProps>(
  ({ animation = "slideUp", delay = 0, duration = 0.6, distance = 20, className, children, ...props }, ref) => {
    const { slideUp, fadeIn, fadeInSlideUp } = useMotion();

    let config;
    if (animation === "fadeIn") {
      config = fadeIn(delay, duration);
    } else if (animation === "slideUp") {
      config = slideUp(delay, duration, distance);
    } else {
      config = fadeInSlideUp(delay, duration, distance);
    }

    return (
      <motion.p
        ref={ref}
        {...({
          initial: config.initial,
          animate: config.animate,
          transition: config.transition,
          className: cn(className),
          ...props
        } as React.ComponentProps<typeof motion.p>)}
      >
        {children}
      </motion.p>
    );
  }
);

MotionP.displayName = "MotionP";

