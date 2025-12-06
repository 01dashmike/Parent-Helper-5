/**
 * Privacy-First Analytics Library
 * 
 * Parent Helper Analytics - GDPR Compliant
 * 
 * - No personal data collected
 * - No cookies used
 * - Anonymous session IDs only
 * - 90-day data retention
 * - Fire-and-forget (non-blocking)
 */

import { v4 as uuidv4 } from "uuid";

// Session ID stored in localStorage (not a cookie - no consent needed)
const SESSION_KEY = "ph_session_id";
const BATCH_DELAY = 500; // Batch events for 500ms before sending

// Queue for batching events
let eventQueue: Array<{ eventType: string; payload: any }> = [];
let batchTimer: NodeJS.Timeout | null = null;

/**
 * Get or create anonymous session ID
 * Uses localStorage to track sessions without cookies
 */
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
 * Send batched events to analytics API
 */
async function flushEvents() {
  if (eventQueue.length === 0) return;

  const events = [...eventQueue];
  eventQueue = [];

  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
    });
  } catch {
    // Silent fail - analytics should never break the app
  }
}

/**
 * Queue an analytics event (batched and debounced)
 */
function queueEvent(eventType: string, payload: any) {
  if (typeof window === "undefined") return;

  try {
    // Add session ID to payload
    const enrichedPayload = {
      ...payload,
      sessionId: getSessionId(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };

    eventQueue.push({ eventType, payload: enrichedPayload });

    // Clear existing timer and set new one
    if (batchTimer) clearTimeout(batchTimer);
    batchTimer = setTimeout(flushEvents, BATCH_DELAY);
  } catch {
    // Silent fail - analytics should never break the app
  }
}

// ========================================
// PUBLIC API
// ========================================

const isTruthy = <T>(value: T | null | undefined): value is T => Boolean(value);

const sanitizeString = (value?: string | null) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const isFeaturedActive = (flags?: {
  budgetOk?: boolean;
  windowActive?: boolean;
  isBoosted?: boolean;
  listingStatus?: string | null;
}) => {
  if (!flags) return false;
  if (!flags.budgetOk) return false;
  if (!flags.windowActive) return false;
  return Boolean(flags.isBoosted || flags.listingStatus === "active");
};

/**
 * Log a search query result set
 */
export function logSearchPerformed(params: {
  query?: string | null;
  location?: string | null;
  category?: string | null;
  ageRange?: string | null;
  resultCount: number;
  featuredCount?: number;
}) {
  try {
    queueEvent("search_performed", {
      hasQuery: isTruthy(params.query),
      queryLength: params.query?.length ?? 0,
      location: sanitizeString(params.location),
      category: sanitizeString(params.category),
      ageRange: sanitizeString(params.ageRange),
      resultCount: Math.max(0, Number.isFinite(params.resultCount) ? params.resultCount : 0),
      featuredCount: Math.max(
        0,
        Number.isFinite(params.featuredCount ?? 0) ? params.featuredCount ?? 0 : 0,
      ),
    });
  } catch {
    // Silent fail - analytics should never break the app
  }
}

// Backwards compatibility for older imports
export const logSearch = logSearchPerformed;

/**
 * Log when a class result is viewed from the split view or map
 */
export function logClassViewed(params: {
  classId: number | string;
  title?: string | null;
  category?: string | null;
  location?: string | null;
  isFeatured?: boolean;
  searchScore?: number | null;
}) {
  try {
    queueEvent("class_viewed", {
      classId: String(params.classId),
      title: sanitizeString(params.title),
      category: sanitizeString(params.category),
      location: sanitizeString(params.location),
      isFeatured: Boolean(params.isFeatured),
      searchScore: Number.isFinite(params.searchScore ?? NaN)
        ? params.searchScore
        : undefined,
    });
  } catch {
    // Silent fail - analytics should never break the app
  }
}

/**
 * Log the start of the provider signup journey
 */
export function logProviderSignupStarted(params: {
  source?: string | null;
  referrer?: string | null;
}) {
  try {
    queueEvent("provider_signup_started", {
      source: sanitizeString(params.source) ?? "providers/register",
      referrer: sanitizeString(params.referrer) ?? (typeof document !== "undefined" ? document.referrer : null),
    });
  } catch {
    // Silent fail - analytics should never break the app
  }
}

/**
 * Log successful submission of the provider signup form
 */
export function logProviderSignupSubmitted(params: {
  source?: string | null;
  categoriesCount: number;
  newsletterOptIn: boolean;
  attachmentsUploaded?: number;
}) {
  try {
    queueEvent("provider_signup_submitted", {
      source: sanitizeString(params.source) ?? "providers/register",
      categoriesCount: Math.max(
        0,
        Number.isFinite(params.categoriesCount) ? params.categoriesCount : 0,
      ),
      newsletterOptIn: Boolean(params.newsletterOptIn),
      attachmentsUploaded: Math.max(
        0,
        Number.isFinite(params.attachmentsUploaded ?? 0) ? params.attachmentsUploaded ?? 0 : 0,
      ),
    });
  } catch {
    // Silent fail - analytics should never break the app
  }
}

/**
 * Log map interaction
 * Tracks which areas parents are exploring
 */
export function logMapInteraction(params: {
  action: "zoom" | "pan" | "cluster_click" | "marker_click";
  zoom: number;
  center?: { lat: number; lng: number };
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}) {
  try {
    queueEvent("map_interaction", {
      action: params.action,
      zoom: params.zoom,
      // Round coordinates to 2 decimal places for privacy
      center: params.center
        ? {
          lat: Math.round(params.center.lat * 100) / 100,
          lng: Math.round(params.center.lng * 100) / 100,
        }
        : null,
      bounds: params.bounds
        ? {
          north: Math.round(params.bounds.north * 100) / 100,
          south: Math.round(params.bounds.south * 100) / 100,
          east: Math.round(params.bounds.east * 100) / 100,
          west: Math.round(params.bounds.west * 100) / 100,
        }
        : null,
    });
  } catch {
    // Silent fail - analytics should never break the app
  }
}

/**
 * Log blog post view
 * Tracks which content is most valuable to parents
 */
export function logBlogView(params: {
  slug: string;
  title: string;
  category?: string;
  timeOnPage?: number;
}) {
  try {
    queueEvent("blog_view", {
      slug: params.slug,
      title: params.title,
      category: params.category || null,
      timeOnPage: params.timeOnPage || 0,
    });
  } catch {
    // Silent fail - analytics should never break the app
  }
}

/**
 * Log class card interaction
 * Tracks which classes get the most engagement
 */
export function logClassInteraction(params: {
  action: "view" | "click" | "favorite";
  classId: number;
  category: string;
  location?: string;
  featured?: {
    budgetOk?: boolean;
    windowActive?: boolean;
    isBoosted?: boolean;
    listingStatus?: string | null;
  };
}) {
  try {
    queueEvent("class_interaction", {
      action: params.action,
      classId: params.classId,
      category: params.category,
      location: params.location || null,
      isFeatured: isFeaturedActive(params.featured),
    });
  } catch {
    // Silent fail - analytics should never break the app
  }
}

/**
 * Log filter change
 * Tracks which filters parents use most
 */
export function logFilterChange(params: {
  filterType: "day" | "time" | "distance" | "age" | "category";
  value: string | number;
}) {
  try {
    queueEvent("filter_change", {
      filterType: params.filterType,
      value: params.value,
    });
  } catch {
    // Silent fail - analytics should never break the app
  }
}

/**
 * Log page view
 * Basic navigation tracking
 */
export function logPageView(params: { path: string; referrer?: string }) {
  try {
    queueEvent("page_view", {
      path: params.path,
      referrer: params.referrer || (typeof document !== "undefined" ? document.referrer : null) || null,
    });
  } catch {
    // Silent fail - analytics should never break the app
  }
}

/**
 * Log when a trend-based blog post is published
 * Helps measure effectiveness of trend-driven content strategy
 */
export function logBlogPublishedFromTrend(params: {
  postId: number;
  slug: string;
  title: string;
  trendSource: string;
  category: string;
}) {
  try {
    queueEvent("blog_published_from_trend", {
      postId: params.postId,
      slug: params.slug,
      title: params.title,
      trendSource: params.trendSource,
      category: params.category,
    });
  } catch {
    // Silent fail - analytics should never break the app
  }
}

/**
 * Log experiment variant assignment
 */
export function logExperimentAssignment(params: {
  experiment: string;
  variant: "A" | "B";
}) {
  try {
    queueEvent("experiment_assignment", {
      experiment: params.experiment,
      variant: params.variant,
    });
  } catch {
    // Silent fail - analytics should never break the app
  }
}

/**
 * Log CTA click with variant context
 */
export function logCtaClick(params: {
  variant: "A" | "B";
  ctaType: string;
  location?: string;
}) {
  try {
    queueEvent("cta_click", {
      variant: params.variant,
      ctaType: params.ctaType,
      location: params.location || null,
    });
  } catch {
    // Silent fail - analytics should never break the app
  }
}

/**
 * Flush any pending events immediately
 * Useful for page unload
 */
export function flushAnalytics() {
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
  flushEvents();
}

// Flush events on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", flushAnalytics);
}

