/**
 * Lightweight Analytics Tracker
 *
 * Simple track() function for personalized experiences
 * Uses sendBeacon for fire-and-forget tracking
 */

import { v4 as uuidv4 } from "uuid";
import { isTrackingEnabled } from "@/lib/env";

const SESSION_KEY = "ph_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "";

  try {
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch {
    // localStorage might be blocked - generate temporary ID
    return uuidv4();
  }
}

/**
 * Track an analytics event
 * Uses sendBeacon for reliable delivery even on page unload
 */
export function track(event: string, props: Record<string, any> = {}) {
  if (typeof window === "undefined") return;
  if (!isTrackingEnabled()) return;

  try {
    const payload = {
      event,
      props,
      path: window.location.pathname,
      referrer: document.referrer || null,
      sessionId: getSessionId(),
      timestamp: new Date().toISOString(),
    };

    // Use sendBeacon for reliable delivery
    try {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      navigator.sendBeacon("/api/track", blob);
    } catch {
      // Fallback to fetch if sendBeacon fails
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // Silent fail - analytics should never break the app
      });
    }
  } catch {
    // Silent fail - analytics should never break the app
  }
}

// Convenience functions for common events
export const trackEvents = {
  pageView: () => {
    try {
      track("page_view");
    } catch {
      // Silent fail - analytics should never break the app
    }
  },
  recommendationClick: (classId: number) => {
    try {
      track("recommendation_click", { class_id: classId });
    } catch {
      // Silent fail - analytics should never break the app
    }
  },
  newsletterSignup: () => {
    try {
      track("newsletter_signup");
    } catch {
      // Silent fail - analytics should never break the app
    }
  },
  savedSearchCreated: (searchParams: Record<string, any>) => {
    try {
      track("saved_search_created", searchParams);
    } catch {
      // Silent fail - analytics should never break the app
    }
  },
  bookingStarted: (classId: number) => {
    try {
      track("booking_started", { class_id: classId });
    } catch {
      // Silent fail - analytics should never break the app
    }
  },
  bookingCompleted: (classId: number, amount?: number) => {
    try {
      track("booking_completed", { class_id: classId, amount });
    } catch {
      // Silent fail - analytics should never break the app
    }
  },
  onboardingCompleted: () => {
    try {
      track("onboarding_completed");
    } catch {
      // Silent fail - analytics should never break the app
    }
  },
  blogRead: (slug: string, title: string) => {
    try {
      track("blog_read", { slug, title });
    } catch {
      // Silent fail - analytics should never break the app
    }
  },
};

