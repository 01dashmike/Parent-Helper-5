const INTERNAL_MAP: Record<string, string> = {
  "classes/sensory": "/classes/london?category=sensory",
  "classes/music": "/classes/london?category=music",
  "classes/yoga": "/classes/london?category=yoga",
  "classes/stem": "/classes/london?category=stem",
  "blog/sleep": "/blog?category=sleep",
};

export function resolveInternalLink(token: string) {
  return INTERNAL_MAP[token] ?? `/${token}`;
}

/**
 * Synchronous version for use in client components where async isn't available.
 * Only handles the INTERNAL_MAP tokens, not blog slug validation.
 */
export function replaceInternalLinksSync(markdown: string): string {
  return markdown.replace(/\[link:([^\]]+)\]/g, (_match, token) => {
    // Don't handle blog/ tokens in sync version - they require DB lookup
    if (token.startsWith("blog/")) {
      // Return as-is, or could return a basic link
      const slug = token.replace(/^blog\//, "");
      return `[${slug.replace(/[-_]/g, " ")}](/blog/${slug})`;
    }
    
    const url = resolveInternalLink(token);
    const label = token.split("/").pop() || token;
    const readable = label.replace(/[-_]/g, " ");
    return `[${readable}](${url})`;
  });
}
