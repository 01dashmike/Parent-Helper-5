"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Custom hook for debouncing a value
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const handler = setTimeout(() => {
      if (isMountedRef.current) {
        setDebouncedValue(value);
      }
    }, delay);

    return () => {
      isMountedRef.current = false;
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

