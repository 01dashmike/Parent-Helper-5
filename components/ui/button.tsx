"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | string;
  size?: "default" | "sm" | "lg" | "icon" | string;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild: _asChild = false, ...props }, ref) => {
    return (
      <motion.button
        {...({ whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, transition: { duration: motionTokens.fast } } as React.ComponentProps<typeof motion.button>)}
        className={cn(
          "inline-flex items-center justify-center rounded-card text-small font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          // WCAG minimum touch target: 44px x 44px
          "min-h-[44px] min-w-[44px]",
          // Minimum padding for interaction area
          "p-2",
          {
            "bg-accent text-white hover:bg-accent/90 active:bg-accent/80": variant === "default",
            "border border-accent/30 bg-transparent hover:bg-accent/10 hover:border-accent/40 active:bg-accent/20": variant === "outline",
            "hover:bg-accent/10 active:bg-accent/20": variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700 active:bg-red-800": variant === "destructive",
            // Size-specific styles (height overrides min-h when larger)
            "h-10 px-md py-sm": size === "default",
            "h-10 px-3 py-sm": size === "sm", // Increased from h-9 to h-10 to meet 44px (px-3 = 0.75rem, no token)
            "h-12 px-xl py-sm": size === "lg", // Increased from h-11 to h-12 to meet 44px
            "h-11 w-11 rounded-full": size === "icon", // Icon buttons should be rounded-full
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };

