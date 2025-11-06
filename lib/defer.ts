/**
 * Defer Utility
 * 
 * Delays non-critical JavaScript execution until the browser is idle
 * Uses requestIdleCallback when available, falls back to setTimeout
 * 
 * Usage:
 * defer(() => {
 *   import('@/lib/analytics');
 *   // Other non-critical code
 * });
 */

export function defer(callback: () => void) {
  if (typeof window === 'undefined') return;

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback);
  } else {
    setTimeout(callback, 1);
  }
}

/**
 * Defer multiple callbacks
 */
export function deferAll(...callbacks: Array<() => void>) {
  callbacks.forEach((cb) => defer(cb));
}

