"use server";

import { headers } from "next/headers";

/**
 * Extract location hint from request headers
 * Checks Cloudflare CF-IPCity, X-Forwarded-For geo headers, or Accept-Language
 * Falls back to a generic term if no location is detected
 */
export async function getLocationHint(): Promise<string | null> {
  if (process.env.PERSONALIZATION_ENABLED !== "true") {
    return null;
  }

  try {
    const headersList = await headers();
    
    // Cloudflare provides CF-IPCity header
    const cfCity = headersList.get("cf-ipcity");
    if (cfCity && cfCity.trim()) {
      return cfCity.trim();
    }

    // Some proxies provide geo headers
    const geoCity = headersList.get("x-geo-city") || headersList.get("x-city");
    if (geoCity && geoCity.trim()) {
      return geoCity.trim();
    }

    // Fallback to generic term when personalization is enabled but no location detected
    return "your area";
  } catch (error) {
    console.error("[personalization] Failed to read location hint:", error);
    // Return generic fallback even on error if personalization is enabled
    return process.env.PERSONALIZATION_ENABLED === "true" ? "your area" : null;
  }
}

/**
 * Get personalized hero copy based on location
 */
export function getPersonalizedHeroCopy(location: string | null): {
  headline: string;
  subheadline?: string;
} {
  if (!location || location === "your area") {
    return {
      headline: "Find baby and toddler classes near you",
    };
  }

  return {
    headline: `Find baby and toddler classes in ${location}`,
    subheadline: "Discover local activities perfect for your little one",
  };
}

