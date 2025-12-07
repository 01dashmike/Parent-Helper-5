import { isBrowser } from "./isBrowser";

export function safeWindow<T>(fn: (w: Window) => T, fallback: T): T {
    if (!isBrowser()) return fallback;
    try {
        return fn(window);
    } catch {
        return fallback;
    }
}

