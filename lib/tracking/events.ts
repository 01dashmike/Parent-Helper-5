/**
 * Client-side Event Tracking Utility
 * 
 * Provides functions to track analytics events from the client
 */

export type EventType =
  | "class_view"
  | "profile_view"
  | "search_impression"
  | "search_click"
  | "website_click"
  | "phone_click"
  | "time_on_page"
  | "scroll_depth"
  | "cta_click"
  | "gallery_open"
  | "video_play";

export interface TrackEventData {
  eventType: EventType;
  providerId?: number;
  classId?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Track an analytics event
 * 
 * @param eventType - Type of event
 * @param data - Event data (providerId, classId, metadata)
 */
export async function trackEvent(
  eventType: EventType,
  data?: {
    providerId?: number;
    classId?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  if (typeof window === "undefined") {
    return; // Server-side, skip
  }

  try {
    await fetch("/api/events/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventType,
        providerId: data?.providerId,
        classId: data?.classId,
        metadata: data?.metadata || {},
      }),
    });
  } catch (error) {
    // Silently fail - analytics should not break the app
    console.error("[Event Tracking] Failed to track event:", error);
  }
}

/**
 * Track a class view
 */
export function trackClassView(classId: number, providerId?: number) {
  return trackEvent("class_view", { classId, providerId });
}

/**
 * Track a profile view
 */
export function trackProfileView(providerId: number) {
  return trackEvent("profile_view", { providerId });
}

/**
 * Track a search impression
 */
export function trackSearchImpression(classId: number, providerId?: number, metadata?: Record<string, any>) {
  return trackEvent("search_impression", { classId, providerId, metadata });
}

/**
 * Track a search click
 */
export function trackSearchClick(classId: number, providerId?: number, metadata?: Record<string, any>) {
  return trackEvent("search_click", { classId, providerId, metadata });
}

/**
 * Track a website click
 */
export function trackWebsiteClick(providerId: number, classId?: number) {
  return trackEvent("website_click", { providerId, classId });
}

/**
 * Track a phone click
 */
export function trackPhoneClick(providerId: number, classId?: number) {
  return trackEvent("phone_click", { providerId, classId });
}

/**
 * Track time on page
 */
export function trackTimeOnPage(seconds: number, providerId?: number, classId?: number) {
  return trackEvent("time_on_page", {
    providerId,
    classId,
    metadata: { seconds },
  });
}

/**
 * Track scroll depth
 */
export function trackScrollDepth(percent: number, providerId?: number, classId?: number) {
  return trackEvent("scroll_depth", {
    providerId,
    classId,
    metadata: { percent },
  });
}

/**
 * Track CTA click
 */
export function trackCtaClick(
  ctaType: string,
  providerId?: number,
  classId?: number,
  metadata?: Record<string, any>
) {
  return trackEvent("cta_click", {
    providerId,
    classId,
    metadata: { ctaType, ...metadata },
  });
}

/**
 * Track gallery open
 */
export function trackGalleryOpen(providerId?: number, classId?: number) {
  return trackEvent("gallery_open", { providerId, classId });
}

/**
 * Track video play
 */
export function trackVideoPlay(providerId?: number, classId?: number) {
  return trackEvent("video_play", { providerId, classId });
}


