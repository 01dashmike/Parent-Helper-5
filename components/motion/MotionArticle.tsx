"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { useMotion } from "@/lib/hooks/useMotion";
import { cn } from "@/lib/utils";

export interface MotionArticleProps extends Omit<HTMLMotionProps<"article">, "initial" | "animate" | "transition" | "whileHover" | "whileInView"> {
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
   * Hover animation (only applied if motion is allowed)
   */
  hoverAnimation?: Record<string, unknown>;
  /**
   * Viewport animation (only applied if motion is allowed)
   */
  viewportAnimation?: Record<string, unknown>;
  /**
   * Viewport settings for scroll-triggered animations
   */
  viewport?: { once?: boolean; amount?: number; margin?: string };
  /**
   * Additional className
   */
  className?: string;
}

/**
 * MotionArticle - Animated article element with reduced-motion support
 */
export const MotionArticle = forwardRef<HTMLElement, MotionArticleProps>(
  (
    {
      animation = "fadeInSlideUp",
      delay = 0,
      duration = 0.5,
      distance = 20,
      hoverAnimation,
      viewportAnimation,
      viewport,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { slideUp, fadeIn, fadeInSlideUp, whileHover } = useMotion();

    let config;
    if (animation === "fadeIn") {
      config = fadeIn(delay, duration);
    } else if (animation === "slideUp") {
      config = slideUp(delay, duration, distance);
    } else {
      config = fadeInSlideUp(delay, duration, distance);
    }

    return (
      <motion.article
        ref={ref}
        {...({ 
          initial: config.initial,
          animate: viewportAnimation || config.animate,
          transition: config.transition,
          whileHover: whileHover(hoverAnimation || {}),
          whileInView: viewportAnimation ? viewportAnimation : undefined,
          viewport,
          className: cn(className),
          ...props
        } as React.ComponentProps<typeof motion.article>)}
      >
        {children}
      </motion.article>
    );
  }
);

MotionArticle.displayName = "MotionArticle";

