"use client";

import { forwardRef, type ReactNode } from "react";
import type { Variants, Transition, TargetAndTransition } from "framer-motion";

type ExtendedProps<T extends keyof JSX.IntrinsicElements> = JSX.IntrinsicElements[T] & {
  initial?: TargetAndTransition | Variants;
  animate?: TargetAndTransition | Variants;
  exit?: TargetAndTransition | Variants;
  transition?: Transition;
  whileHover?: TargetAndTransition | Variants;
  whileTap?: TargetAndTransition | Variants;
  whileInView?: TargetAndTransition | Variants;
  viewport?: { once?: boolean; margin?: string; amount?: number };
  variants?: Variants;
};

function createMotionPrimitive<T extends keyof JSX.IntrinsicElements>(tag: T) {
  const MotionPrimitive = forwardRef<HTMLElement, ExtendedProps<T>>(function MotionPrimitive(
    { initial, animate, exit, transition, whileHover, whileTap, whileInView, viewport, variants, ...rest },
    ref,
  ) {
    // Component type is determined by the tag parameter, which is constrained to valid HTML element names
    // Using 'as' here is safe because T extends keyof JSX.IntrinsicElements guarantees valid element types
    const Component = tag as keyof JSX.IntrinsicElements;
    return <Component {...({ ref, ...rest } as JSX.IntrinsicElements[T])} />;
  });
  
  MotionPrimitive.displayName = `MotionPrimitive(${tag})`;
  return MotionPrimitive;
}

export const motion = {
  div: createMotionPrimitive("div"),
  form: createMotionPrimitive("form"),
  section: createMotionPrimitive("section"),
  header: createMotionPrimitive("header"),
  article: createMotionPrimitive("article"),
  h1: createMotionPrimitive("h1"),
  p: createMotionPrimitive("p"),
};

export function AnimatePresence({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
