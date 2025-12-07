"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { useMotion, type AnimationConfig } from "@/lib/hooks/useMotion";
import { cn } from "@/lib/utils";

export interface MotionDivProps extends Omit<HTMLMotionProps<"div">, "initial" | "animate" | "exit" | "transition"> {
  /**
   * Animation type to apply
   */
  animation?: "fadeIn" | "slideUp" | "scaleIn" | "fadeInSlideUp" | AnimationConfig;
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
   * Starting scale for scale animations
   */
  fromScale?: number;
  /**
   * Custom animation config (overrides animation prop)
   */
  animationConfig?: AnimationConfig;
  /**
   * Hover animation (only applied if motion is allowed)
   */
  hoverAnimation?: Record<string, unknown>;
  /**
   * Tap animation (only applied if motion is allowed)
   */
  tapAnimation?: Record<string, unknown>;
  /**
   * Viewport animation (only applied if motion is allowed)
   */
  viewportAnimation?: Record<string, unknown>;
  /**
   * Viewport settings for scroll-triggered animations
   */
  viewport?: { once?: boolean; amount?: number; margin?: string };
  /**
   * Exit animation
   */
  exitAnimation?: AnimationConfig["exit"];
  /**
   * Additional className
   */
  className?: string;
}

/**
 * MotionDiv - A wrapper component that applies animations with reduced-motion support
 * 
 * Automatically respects prefers-reduced-motion and falls back to no animation
 * when the user has reduced motion enabled.
 */
export const MotionDiv = forwardRef<HTMLDivElement, MotionDivProps>(
  (
    {
      animation,
      delay = 0,
      duration,
      distance,
      fromScale,
      animationConfig,
      hoverAnimation,
      tapAnimation,
      viewportAnimation,
      viewport,
      exitAnimation,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { fadeIn, slideUp, scaleIn, fadeInSlideUp, whileHover, whileTap } = useMotion();

    // Determine animation config
    let config: AnimationConfig;
    
    if (animationConfig) {
      config = animationConfig;
    } else if (animation === "fadeIn") {
      config = fadeIn(delay, duration);
    } else if (animation === "slideUp") {
      config = slideUp(delay, duration, distance);
    } else if (animation === "scaleIn") {
      config = scaleIn(delay, duration, fromScale);
    } else if (animation === "fadeInSlideUp") {
      config = fadeInSlideUp(delay, duration, distance);
    } else if (typeof animation === "object") {
      config = animation;
    } else {
      // Default: no animation
      config = {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        transition: { duration: 0 },
      };
    }

    // Apply exit animation if provided
    if (exitAnimation) {
      config.exit = exitAnimation;
    }

    // Apply viewport animation if provided
    if (viewportAnimation && !config.animate) {
      config.animate = viewportAnimation;
    }

    return (
      <motion.div
        ref={ref}
        {...({
          initial: config.initial,
          animate: config.animate,
          exit: config.exit,
          transition: config.transition,
          whileHover: whileHover(hoverAnimation || {}),
          whileTap: whileTap(tapAnimation || {}),
          whileInView: viewportAnimation ? viewportAnimation : undefined,
          viewport,
          className: cn(className),
          ...props
        } as React.ComponentProps<typeof motion.div>)}
      >
        {children}
      </motion.div>
    );
  }
);

MotionDiv.displayName = "MotionDiv";

