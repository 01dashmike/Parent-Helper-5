/**
 * Browser API utilities for safe SSR usage
 * These helpers ensure browser-only APIs are only accessed on the client
 */

/**
 * Check if code is running in browser (client-side)
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Safe window access - returns null during SSR
 */
export function safeWindow(): Window | null {
  return typeof window !== "undefined" ? window : null;
}

/**
 * Safe document access - returns null during SSR
 */
export function safeDocument(): Document | null {
  return typeof document !== "undefined" ? document : null;
}

/**
 * Safe localStorage access - returns null during SSR
 */
export function safeLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Safe navigator access - returns null during SSR
 */
export function safeNavigator(): Navigator | null {
  return typeof navigator !== "undefined" ? navigator : null;
}

/**
 * Safe matchMedia access - returns null during SSR
 */
export function safeMatchMedia(query: string): MediaQueryList | null {
  if (typeof window === "undefined") return null;
  try {
    return window.matchMedia(query);
  } catch {
    return null;
  }
}

