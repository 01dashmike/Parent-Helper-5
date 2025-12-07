/**
 * Funnel Tracking Library
 * 
 * Tracks user progression through key conversion funnels:
 * - Provider onboarding
 * - Class booking
 * - Search → click → conversion
 * - Wallet actions
 * 
 * Events tracked:
 * - funnel_step_started: User enters a funnel step
 * - funnel_step_completed: User completes a funnel step
 * - funnel_step_abandoned: User abandons a funnel step (after timeout)
 */

import { v4 as uuidv4 } from "uuid";

// Session ID stored in localStorage
const SESSION_KEY = "ph_session_id";
const ABANDONMENT_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Active funnel step tracking (in-memory, per session)
const activeSteps = new Map<string, { timer: NodeJS.Timeout; startedAt: Date }>();

/**
 * Get or create anonymous session ID
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
    return uuidv4();
  }
}

/**
 * Get current user ID (if authenticated)
 */
async function getUserId(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    // Try to get user from Supabase client
    const { createSupabaseBrowserClient } = await import("@/lib/supabase/browser");
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

/**
 * Send funnel event to API
 */
async function sendFunnelEvent(event: {
  funnelName: string;
  funnelStep: string;
  eventType: "funnel_step_started" | "funnel_step_completed" | "funnel_step_abandoned";
  metadata?: Record<string, any>;
  startedAt?: string;
  completedAt?: string;
  abandonedAt?: string;
  durationSeconds?: number;
}) {
  if (typeof window === "undefined") return;

  try {
    const userId = await getUserId();
    const sessionId = getSessionId();

    await fetch("/api/analytics/funnels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...event,
        userId,
        sessionId,
      }),
    });
  } catch {
    // Silent fail - analytics should never break the app
  }
}

/**
 * Track when a user starts a funnel step
 */
export async function trackFunnelStepStarted(params: {
  funnelName: string;
  funnelStep: string;
  metadata?: Record<string, any>;
}) {
  if (typeof window === "undefined") return;

  try {
    const stepKey = `${params.funnelName}:${params.funnelStep}`;
    const startedAt = new Date();

    // Clear any existing abandonment timer for this step
    const existing = activeSteps.get(stepKey);
    if (existing) {
      clearTimeout(existing.timer);
    }

    // Set abandonment timer
    const timer = setTimeout(() => {
      trackFunnelStepAbandoned({
        funnelName: params.funnelName,
        funnelStep: params.funnelStep,
        metadata: params.metadata,
      });
      activeSteps.delete(stepKey);
    }, ABANDONMENT_TIMEOUT);

    activeSteps.set(stepKey, { timer, startedAt });

    await sendFunnelEvent({
      funnelName: params.funnelName,
      funnelStep: params.funnelStep,
      eventType: "funnel_step_started",
      metadata: params.metadata || {},
      startedAt: startedAt.toISOString(),
    });
  } catch {
    // Silent fail
  }
}

/**
 * Track when a user completes a funnel step
 */
export async function trackFunnelStepCompleted(params: {
  funnelName: string;
  funnelStep: string;
  metadata?: Record<string, any>;
}) {
  if (typeof window === "undefined") return;

  try {
    const stepKey = `${params.funnelName}:${params.funnelStep}`;
    const completedAt = new Date();

    // Clear abandonment timer
    const existing = activeSteps.get(stepKey);
    if (existing) {
      clearTimeout(existing.timer);
      activeSteps.delete(stepKey);

      // Calculate duration
      const durationSeconds = Math.floor((completedAt.getTime() - existing.startedAt.getTime()) / 1000);

      await sendFunnelEvent({
        funnelName: params.funnelName,
        funnelStep: params.funnelStep,
        eventType: "funnel_step_completed",
        metadata: params.metadata || {},
        startedAt: existing.startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationSeconds,
      });
    } else {
      // Step was started but timer was cleared (shouldn't happen, but handle gracefully)
      await sendFunnelEvent({
        funnelName: params.funnelName,
        funnelStep: params.funnelStep,
        eventType: "funnel_step_completed",
        metadata: params.metadata || {},
        completedAt: completedAt.toISOString(),
      });
    }
  } catch {
    // Silent fail
  }
}

/**
 * Track when a user abandons a funnel step
 */
export async function trackFunnelStepAbandoned(params: {
  funnelName: string;
  funnelStep: string;
  metadata?: Record<string, any>;
}) {
  if (typeof window === "undefined") return;

  try {
    const stepKey = `${params.funnelName}:${params.funnelStep}`;
    const abandonedAt = new Date();

    // Get started time if available
    const existing = activeSteps.get(stepKey);
    const startedAt = existing?.startedAt;

    // Clear timer and remove from active steps
    if (existing) {
      clearTimeout(existing.timer);
      activeSteps.delete(stepKey);
    }

    await sendFunnelEvent({
      funnelName: params.funnelName,
      funnelStep: params.funnelStep,
      eventType: "funnel_step_abandoned",
      metadata: params.metadata || {},
      startedAt: startedAt?.toISOString(),
      abandonedAt: abandonedAt.toISOString(),
      durationSeconds: startedAt
        ? Math.floor((abandonedAt.getTime() - startedAt.getTime()) / 1000)
        : undefined,
    });
  } catch {
    // Silent fail
  }
}

/**
 * Clear all active funnel steps (e.g., on logout or page unload)
 */
export function clearActiveFunnelSteps() {
  for (const [stepKey, { timer }] of activeSteps.entries()) {
    clearTimeout(timer);
    activeSteps.delete(stepKey);
  }
}

// Clear active steps on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", clearActiveFunnelSteps);
}

