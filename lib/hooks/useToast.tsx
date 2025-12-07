"use client";

import { useState, useCallback, type ReactElement } from "react";
import { SimpleToast } from "@/components/ui/simpletoast";

type ToastMessage = {
  message: string;
  variant?: "success" | "error";
  duration?: number;
};

export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((message: string, variant: "success" | "error" = "success", duration?: number) => {
    setToast({ message, variant, duration });
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, "success", duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast(message, "error", duration);
  }, [showToast]);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const ToastComponent: ReactElement | null = toast ? (
    <SimpleToast
      message={toast.message}
      variant={toast.variant}
      duration={toast.duration}
      onClose={hideToast}
    />
  ) : null;

  return {
    showToast,
    showSuccess,
    showError,
    hideToast,
    ToastComponent,
  };
}

