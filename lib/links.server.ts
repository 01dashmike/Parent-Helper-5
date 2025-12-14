import { getSupabaseServer } from "./supabase.server";
import { hasSupabaseServerEnv } from "./env";
import { resolveInternalLink } from "./links";

/**
 * Resolves a blog slug to its URL by checking if the post exists in the database.
 * Returns the blog URL if found, null otherwise.
 */
async function resolveBlogLink(slug: string): Promise<string | null> {
  if (!hasSupabaseServerEnv()) {
    // If Supabase is not configured, fall back to assuming the link is valid
    return `/blog/${slug}`;
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return `/blog/${slug}`;
  }

  try {
    const { data } = await supabase
      .from("blog_posts_ai")
      .select("slug, status")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (data) {
      return `/blog/${slug}`;
    }
  } catch (error) {
    console.error("Error resolving blog link:", error);
  }

  return null;
}

/**
 * Replaces internal link tokens in markdown with actual markdown links.
 * Supports:
 * - Custom tokens: [link:blog/slug-here] or [link:classes/category]
 * - Standard markdown links: [text](/blog/slug) - validates blog slugs exist
 */
export async function replaceInternalLinks(markdown: string): Promise<string> {
  let processed = markdown;

  // Process custom link tokens [link:token]
  const customLinkMatches = [...markdown.matchAll(/\[link:([^\]]+)\]/g)];
  
  for (const match of customLinkMatches) {
    const token = match[1];
    let replacement: string;
    
    if (token.startsWith("blog/")) {
      const slug = token.replace(/^blog\//, "");
      const url = await resolveBlogLink(slug);
      if (url) {
        const label = slug.split("/").pop() || slug;
        const readable = label.replace(/[-_]/g, " ");
        replacement = `[${readable}](${url})`;
      } else {
        // If blog not found, leave as is
        replacement = match[0];
      }
    } else {
      const url = resolveInternalLink(token);
      const label = token.split("/").pop() || token;
      const readable = label.replace(/[-_]/g, " ");
      replacement = `[${readable}](${url})`;
    }
    
    processed = processed.replace(match[0], replacement);
  }

  // Note: Standard markdown links like [text](/blog/slug) are already valid
  // and will work as-is. We could validate them, but for now we'll trust
  // that authors will use correct slugs. The custom token format is preferred
  // for internal linking as it validates existence.

  return processed;
}

