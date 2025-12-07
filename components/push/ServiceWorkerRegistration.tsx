"use client";

import { useEffect } from "react";
import { isPWAPushEnabled } from "@/lib/env";

// Import service worker registration function (assumed to exist)
// If this doesn't exist, create a placeholder or import from appropriate location
async function registerServiceWorker(): Promise<void> {
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("[ServiceWorkerRegistration] Service worker registered:", registration.scope);
  }
}

export function ServiceWorkerRegistration(): null {
  useEffect(() => {
    // Robust flag check - early return if feature is disabled
    if (typeof window === "undefined" || !isPWAPushEnabled()) {
      return;
    }

    // Register service worker
    registerServiceWorker().catch((_error) => {
      console.error("[ServiceWorkerRegistration] Unexpected error:", _error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Reason: effect should only run once on mount to register service worker
  }, []);

  return null;
}

