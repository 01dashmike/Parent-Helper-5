"use client";

type NewsletterEvent = "newsletter_impression" | "newsletter_signup";

type Payload = Record<string, unknown> | undefined;

export async function trackEvent(type: NewsletterEvent, payload?: Payload) {
  const utmString =
    typeof window !== "undefined" ? window.localStorage.getItem("ph_utm_data") : null;
  const geoString =
    typeof window !== "undefined" ? window.localStorage.getItem("ph_geo_data") : null;

  const shouldLogToServer = type === "newsletter_impression";

  if (shouldLogToServer) {
    try {
      await fetch("/api/newsletter-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-utm-data": utmString || "{}",
          "x-geo-data": geoString || "{}",
        },
        body: JSON.stringify({
          event_type: "impression",
          email: payload?.email,
          postcode: payload?.postcode,
          source: payload?.source || "popup",
        }),
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[trackEvent] failed to log to Supabase", error);
      }
    }
  }

  const gtagFn = typeof window !== "undefined" ? (window as GtagWindow).gtag : undefined;
  if (typeof gtagFn === "function") {
    gtagFn("event", type, {
      event_category: "Newsletter",
      event_label: payload?.source || "popup",
      ...payload,
    });
  }

  const fbqFn = typeof window !== "undefined" ? (window as FbqWindow).fbq : undefined;
  if (typeof fbqFn === "function") {
    fbqFn("trackCustom", type, payload || {});
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[trackEvent] ${type}`, payload);
  }
}

declare global {
  interface GtagWindow {
    gtag?: (...args: unknown[]) => void;
  }
  interface FbqWindow {
    fbq?: (...args: unknown[]) => void;
  }
}
