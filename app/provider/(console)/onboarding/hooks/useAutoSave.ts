"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseAutoSaveOptions {
  fieldName: string;
  value: unknown;
  action: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  enabled?: boolean;
  debounceMs?: number;
}

/**
 * Auto-save hook for form fields
 * Saves on blur and after debounced inactivity
 */
export function useAutoSave({
  fieldName,
  value,
  action,
  enabled = true,
  debounceMs = 1500,
}: UseAutoSaveOptions) {
  const previousValueRef = useRef(value);
  const hasBlurredRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveValue = useCallback(
    async (val: unknown) => {
      if (!enabled || val === previousValueRef.current) return;

      const formData = new FormData();
      if (typeof val === "string") {
        formData.set(fieldName, val);
      } else if (typeof val === "number") {
        formData.set(fieldName, val.toString());
      } else {
        formData.set(fieldName, JSON.stringify(val));
      }

      try {
        await action(formData);
        previousValueRef.current = val;
      } catch (error) {
        // Silently fail - auto-save should not interrupt user flow
        console.error("Auto-save failed:", error);
      }
    },
    [fieldName, action, enabled]
  );

  useEffect(() => {
    if (enabled && value !== previousValueRef.current && hasBlurredRef.current) {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        saveValue(value);
      }, debounceMs);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, enabled, debounceMs, saveValue]);

  const handleBlur = useCallback(() => {
    hasBlurredRef.current = true;
    if (enabled && value !== previousValueRef.current) {
      // Clear timeout and save immediately
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      saveValue(value);
    }
  }, [enabled, value, saveValue]);

  return { handleBlur };
}

