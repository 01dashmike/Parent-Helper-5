"use client";

import { useEffect } from "react";
import { initErrorReporter } from "@/lib/errorReporter";

/**
 * ErrorReporter component
 * Initializes client-side error tracking when mounted
 * Should be included in the root layout
 */
export function ErrorReporter() {
  useEffect(() => {
    initErrorReporter();
  }, []);

  return null;
}

