"use client";

import { Sparkles } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";

interface SendBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function SendBadge({ className = "", size = "md" }: SendBadgeProps) {
  const sizeClasses = {
    sm: "h-4 w-4 text-small px-2 py-0.5",
    md: "h-5 w-5 text-small px-3 py-1",
    lg: "h-6 w-6 text-body px-4 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-brand/10 font-medium text-brand ${sizeClasses[size]} ${className}`}
    >
      <Sparkles size={iconSize.sm} aria-hidden="true" />
      SEND-Friendly
    </span>
  );
}


