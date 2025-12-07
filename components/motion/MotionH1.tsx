"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { useMotion } from "@/lib/hooks/useMotion";
import { cn } from "@/lib/utils";

export interface MotionH1Props extends Omit<HTMLMotionProps<"h1">, "initial" | "animate" | "transition"> {
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
 * MotionH1 - Animated h1 element with reduced-motion support
 */
export const MotionH1 = forwardRef<HTMLHeadingElement, MotionH1Props>(
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
      <motion.h1
        ref={ref}
        {...({
          initial: config.initial,
          animate: config.animate,
          transition: config.transition,
          className: cn(className),
          ...props
        } as React.ComponentProps<typeof motion.h1>)}
      >
        {children}
      </motion.h1>
    );
  }
);

MotionH1.displayName = "MotionH1";

