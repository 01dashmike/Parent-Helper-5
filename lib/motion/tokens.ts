/**
 * Motion tokens for framer-motion animations
 * Standardized timing and easing values for consistent animations across the app
 */

export const motionTokens = {
  // Duration tokens (in seconds)
  fast: 0.15,      // 150ms - quick interactions, hover states
  medium: 0.3,     // 300ms - standard transitions, entry/exit animations
  slow: 0.5,       // 500ms - longer animations, complex transitions
  
  // Easing tokens
  standard: "ease-in-out",  // Standard easing for most animations
  easeOut: "easeOut",       // Ease out for exit animations
  easeIn: "easeIn",         // Ease in for entry animations
} as const;

/**
 * Helper to get motion transition object with standardized tokens
 */
export function getMotionTransition(
  duration: keyof typeof motionTokens | number = "medium",
  ease: keyof typeof motionTokens | string = "standard"
) {
  const durationValue = typeof duration === "string" ? motionTokens[duration] : duration;
  const easeValue = typeof ease === "string" && ease in motionTokens 
    ? motionTokens[ease as keyof typeof motionTokens] 
    : ease;
  
  return {
    duration: durationValue,
    ease: easeValue,
  };
}

