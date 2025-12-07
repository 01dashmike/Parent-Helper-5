/**
 * Global Animation & Motion System
 * 
 * Provides unified animation components with WCAG-friendly reduced-motion support.
 * All animations automatically respect prefers-reduced-motion settings.
 */

export { MotionDiv } from "./MotionDiv";
export type { MotionDivProps } from "./MotionDiv";

export { MotionH1 } from "./MotionH1";
export type { MotionH1Props } from "./MotionH1";

export { MotionP } from "./MotionP";
export type { MotionPProps } from "./MotionP";

export { MotionForm } from "./MotionForm";
export type { MotionFormProps } from "./MotionForm";

export { MotionArticle } from "./MotionArticle";
export type { MotionArticleProps } from "./MotionArticle";

export { useMotion } from "@/lib/hooks/useMotion";
export type { AnimationConfig } from "@/lib/hooks/useMotion";

