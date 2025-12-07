/**
 * Minimal Analytics Abstraction
 * 
 * This abstraction layer allows easy replacement of the underlying analytics provider.
 * Currently uses a no-op implementation that can be swapped for Google Analytics, Mixpanel, etc.
 */

type AnalyticsPayload = Record<string, unknown>;

/**
 * Track a custom event
 * @param eventName - Name of the event (e.g., "search_performed", "class_viewed")
 * @param payload - Additional event data
 */
export function track(eventName: string, payload?: AnalyticsPayload): void {
  if (typeof window === "undefined") {
    // SSR: no-op
    return;
  }

  // TODO: Replace with actual analytics provider
  // Examples:
  // - Google Analytics: gtag('event', eventName, payload)
  // - Mixpanel: mixpanel.track(eventName, payload)
  // - PostHog: posthog.capture(eventName, payload)
  
  // For now, log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", eventName, payload);
  }

  // Optional: Send to your own analytics endpoint
  // fetch('/api/analytics', { method: 'POST', body: JSON.stringify({ eventName, payload }) })
}

/**
 * Identify a user
 * @param userId - User ID (UUID or email)
 * @param traits - User traits/attributes
 */
export function identify(userId: string, traits?: AnalyticsPayload): void {
  if (typeof window === "undefined") {
    // SSR: no-op
    return;
  }

  // TODO: Replace with actual analytics provider
  // Examples:
  // - Google Analytics: gtag('set', { user_id: userId })
  // - Mixpanel: mixpanel.identify(userId); mixpanel.people.set(traits)
  // - PostHog: posthog.identify(userId, traits)
  
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics] Identify", userId, traits);
  }
}

/**
 * Track a page view
 * @param path - Optional path (defaults to current pathname)
 * @param title - Optional page title
 */
export function page(path?: string, title?: string): void {
  if (typeof window === "undefined") {
    // SSR: no-op
    return;
  }

  const pagePath = path || window.location.pathname;
  const pageTitle = title || document.title;

  // TODO: Replace with actual analytics provider
  // Examples:
  // - Google Analytics: gtag('config', 'GA_MEASUREMENT_ID', { page_path: pagePath, page_title: pageTitle })
  // - Mixpanel: mixpanel.track('Page View', { path: pagePath, title: pageTitle })
  // - PostHog: posthog.capture('$pageview', { path: pagePath, title: pageTitle })
  
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics] Page View", pagePath, pageTitle);
  }

  // Track as event for consistency
  track("page_view", {
    path: pagePath,
    title: pageTitle,
  });
}

/**
 * Reset user identification (on logout)
 */
export function reset(): void {
  if (typeof window === "undefined") {
    return;
  }

  // TODO: Replace with actual analytics provider
  // Examples:
  // - Mixpanel: mixpanel.reset()
  // - PostHog: posthog.reset()
  
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics] Reset");
  }
}

