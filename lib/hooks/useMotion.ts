"use client";

import { useReducedMotion } from "./useReducedMotion";
import type { Variants, Transition } from "framer-motion";

/**
 * Animation helper functions that respect reduced motion preferences
 */
export type AnimationConfig = {
  initial?: Variants["initial"];
  animate?: Variants["animate"];
  exit?: Variants["exit"];
  transition?: Transition;
};

/**
 * Hook to provide motion utilities with reduced-motion support
 * 
 * @returns Object with reduced motion state and animation helpers
 */
export function useMotion() {
  const prefersReducedMotion = useReducedMotion();

  /**
   * Fade in animation
   * @param delay - Delay in seconds (default: 0)
   * @param duration - Duration in seconds (default: 0.5)
   */
  const fadeIn = (delay = 0, duration = 0.5): AnimationConfig => {
    if (prefersReducedMotion) {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        transition: { duration: 0 },
      };
    }

    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: {
        delay,
        duration,
        ease: "easeOut",
      },
    };
  };

  /**
   * Slide up animation
   * @param delay - Delay in seconds (default: 0)
   * @param duration - Duration in seconds (default: 0.5)
   * @param distance - Distance in pixels (default: 20)
   */
  const slideUp = (delay = 0, duration = 0.5, distance = 20): AnimationConfig => {
    if (prefersReducedMotion) {
      return {
        initial: { opacity: 1, y: 0 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0 },
      };
    }

    return {
      initial: { opacity: 0, y: distance },
      animate: { opacity: 1, y: 0 },
      transition: {
        delay,
        duration,
        ease: "easeOut",
      },
    };
  };

  /**
   * Scale in animation
   * @param delay - Delay in seconds (default: 0)
   * @param duration - Duration in seconds (default: 0.4)
   * @param fromScale - Starting scale (default: 0.95)
   */
  const scaleIn = (delay = 0, duration = 0.4, fromScale = 0.95): AnimationConfig => {
    if (prefersReducedMotion) {
      return {
        initial: { opacity: 1, scale: 1 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0 },
      };
    }

    return {
      initial: { opacity: 0, scale: fromScale },
      animate: { opacity: 1, scale: 1 },
      transition: {
        delay,
        duration,
        ease: [0.22, 1, 0.36, 1],
      },
    };
  };

  /**
   * Combined fade and slide up animation
   * @param delay - Delay in seconds (default: 0)
   * @param duration - Duration in seconds (default: 0.5)
   * @param distance - Distance in pixels (default: 20)
   */
  const fadeInSlideUp = (delay = 0, duration = 0.5, distance = 20): AnimationConfig => {
    return slideUp(delay, duration, distance);
  };

  /**
   * Hover animation (only if motion is allowed)
   * @param config - Hover animation config
   */
  const whileHover = (config: Record<string, unknown>): Record<string, unknown> | undefined => {
    if (prefersReducedMotion) {
      return undefined;
    }
    return config;
  };

  /**
   * Tap animation (only if motion is allowed)
   * @param config - Tap animation config
   */
  const whileTap = (config: Record<string, unknown>): Record<string, unknown> | undefined => {
    if (prefersReducedMotion) {
      return undefined;
    }
    return config;
  };

  return {
    prefersReducedMotion,
    fadeIn,
    slideUp,
    scaleIn,
    fadeInSlideUp,
    whileHover,
    whileTap,
  };
}

