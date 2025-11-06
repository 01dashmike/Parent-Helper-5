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
  } catch (error) {
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
  } catch (error) {
    // Silent fail - analytics should never break the app
    console.debug("Analytics event failed:", error);
  }
}

/**
 * Queue an analytics event (batched and debounced)
 */
function queueEvent(eventType: string, payload: any) {
  if (typeof window === "undefined") return;

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
}

// ========================================
// PUBLIC API
// ========================================

/**
 * Log a search query
 * Tracks what parents are searching for to improve recommendations
 */
export function logSearch(params: {
  query?: string;
  location?: string;
  category?: string;
  ageRange?: string;
  dayOfWeek?: string;
  resultCount: number;
}) {
  queueEvent("search", {
    // Anonymize: only track search patterns, not exact queries
    hasQuery: !!params.query,
    queryLength: params.query?.length || 0,
    location: params.location || null,
    category: params.category || null,
    ageRange: params.ageRange || null,
    dayOfWeek: params.dayOfWeek || null,
    resultCount: params.resultCount,
  });
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
  queueEvent("blog_view", {
    slug: params.slug,
    title: params.title,
    category: params.category || null,
    timeOnPage: params.timeOnPage || 0,
  });
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
}) {
  queueEvent("class_interaction", {
    action: params.action,
    classId: params.classId,
    category: params.category,
    location: params.location || null,
  });
}

/**
 * Log filter change
 * Tracks which filters parents use most
 */
export function logFilterChange(params: {
  filterType: "day" | "time" | "distance" | "age" | "category";
  value: string | number;
}) {
  queueEvent("filter_change", {
    filterType: params.filterType,
    value: params.value,
  });
}

/**
 * Log page view
 * Basic navigation tracking
 */
export function logPageView(params: { path: string; referrer?: string }) {
  queueEvent("page_view", {
    path: params.path,
    referrer: params.referrer || document.referrer || null,
  });
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
  queueEvent("blog_published_from_trend", {
    postId: params.postId,
    slug: params.slug,
    title: params.title,
    trendSource: params.trendSource,
    category: params.category,
  });
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

