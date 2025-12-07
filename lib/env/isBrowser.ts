export function isBrowser() {
    return typeof window !== "undefined" && typeof document !== "undefined";
}

export function isServer() {
    return !isBrowser();
}

