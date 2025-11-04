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

export function replaceInternalLinks(markdown: string) {
  return markdown.replace(/\[link:([^\]]+)\]/g, (_match, token) => {
    const url = resolveInternalLink(token);
    const label = token.split("/").pop() || token;
    const readable = label.replace(/[-_]/g, " ");
    return `[${readable}](${url})`;
  });
}
