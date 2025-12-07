"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/buttons";

interface SimpleToastProps {
  message: string;
  variant?: "success" | "error";
  duration?: number;
  onClose: () => void;
}

/**
 * Simple Toast component for use with custom useToast hook
 * Provides accessible toast notifications with proper ARIA attributes
 */
export function SimpleToast({
  message,
  variant = "success",
  duration = 5000,
  onClose,
}: SimpleToastProps) {
  const isError = variant === "error";

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-atomic="true"
      className={cn(
        "toast bottom-6 left-1/2 -translate-x-1/2 mx-4",
        isError ? "toast-error" : "toast-success"
      )}
    >
      <p className="flex-1 text-small font-medium">{message}</p>
      <IconButton
        icon={<X size={iconSize.sm} aria-hidden="true" />}
        aria-label="Close notification"
        variant="ghost"
        size="sm"
        onClick={onClose}
      />
    </div>
  );
}

