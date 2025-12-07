export function getSiteUrl() {
    if (process.env["NEXT_PUBLIC_APP_URL"]) return process.env["NEXT_PUBLIC_APP_URL"];
    if (process.env["APP_URL"]) return process.env["APP_URL"];
    if (process.env["VERCEL_URL"]) return `https://${process.env["VERCEL_URL"]}`;
    return "http://localhost:3000";
}

export function buildAbsoluteUrl(path: string) {
    const base = getSiteUrl();
    if (!path) return base;
    try {
        return new URL(path, base).toString();
    } catch {
        return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    }
}

