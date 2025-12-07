"use client";

import { useEffect } from "react";

/**
 * Track onboarding analytics events
 * Uses fetch to send events to analytics API
 */
export function useOnboardingAnalytics(
  event: "step_view" | "step_save" | "step_error" | "completed",
  stepId?: string,
  providerId?: number,
  error?: string
) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const trackEvent = async () => {
      try {
        await fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            events: [{
              eventType: `onboarding_${event}`,
              payload: {
                step_id: stepId,
                provider_id: providerId,
                error: error,
              },
            }],
          }),
        });
      } catch (error) {
        // Silently fail - analytics should not break the app
        console.error("Analytics error:", error);
      }
    };

    trackEvent();
  }, [event, stepId, providerId, error]);
}

