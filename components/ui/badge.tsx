import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-small font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-sage text-white hover:bg-sage/80",
        destructive: "bg-red-600 text-white border-transparent hover:bg-red-700",
        outline: "text-charcoal border-sage/30",
        secondary: "bg-charcoal/5 text-charcoal border-transparent",
        success: "bg-green-600 text-white border-transparent",
        info: "bg-blue-600 text-white border-transparent",
        warning: "bg-amber-500 text-white border-transparent",
        active: "bg-green-600 text-white border-transparent",
        highlight: "bg-blue-600 text-white border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeVariant = "default" | "destructive" | "outline" | "secondary" | "success" | "info" | "warning" | "active" | "highlight";

interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "variant"> {
  variant?: BadgeVariant | null | undefined;
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
