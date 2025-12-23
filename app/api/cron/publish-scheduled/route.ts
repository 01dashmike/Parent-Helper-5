export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { getSupabaseServer } from "@/lib/supabase.server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

/**
 * Cron job to publish scheduled blog posts
 * This should be called by a cron service (e.g., Vercel Cron) every few minutes
 * 
 * Example Vercel cron config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/publish-scheduled",
 *     "schedule": "*/5 * * * *"
 *   }]
 * }
 */
export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }

  const now = new Date().toISOString();

  // Find all scheduled posts that are due for publication
  const { data: scheduledPosts, error: fetchError } = await supabase
    .from("blog_posts_ai")
    .select("id, title, slug, seo_title, seo_description, category, locality, hero_image, created_at")
    .eq("status", "scheduled")
    .lte("scheduled_for", now);

  if (fetchError) {
    console.error("Error fetching scheduled posts:", fetchError);
    return NextResponse.json({ error: "Failed to fetch scheduled posts" }, { status: 500 });
  }

  if (!scheduledPosts || scheduledPosts.length === 0) {
    return NextResponse.json({ message: "No posts to publish", count: 0 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://parenthelper.example";
  const publishedSlugs: string[] = [];
  const errors: string[] = [];

  for (const post of scheduledPosts) {
    try {
      const heroImage = post.hero_image
        ? post.hero_image.startsWith("http")
          ? post.hero_image
          : `${baseUrl}${post.hero_image}`
        : undefined;

      const schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.seo_title || post.title,
        description: post.seo_description || post.seo_title,
        author: {
          "@type": "Person",
          name: "Parent Helper",
        },
        publisher: {
          "@type": "Organization",
          name: "Parent Helper",
          logo: {
            "@type": "ImageObject",
            url: `${baseUrl}/images/logo.png`,
          },
        },
        url: `${baseUrl}/blog/${post.slug}`,
        image: heroImage ? [heroImage] : undefined,
        datePublished: post.created_at ?? new Date().toISOString(),
        dateModified: new Date().toISOString(),
        articleSection: post.category,
        about: post.locality ?? undefined,
      };

      const { error: updateError } = await supabase
        .from("blog_posts_ai")
        .update({
          status: "published",
          schema_json: schema,
          scheduled_for: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post.id);

      if (updateError) {
        errors.push(`Failed to publish ${post.title}: ${updateError.message}`);
      } else {
        publishedSlugs.push(post.slug);
        console.log(`Published scheduled post: ${post.title}`);
      }
    } catch (err) {
      errors.push(`Error publishing ${post.title}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  // Revalidate blog pages
  if (publishedSlugs.length > 0) {
    revalidatePath("/blog");
    for (const slug of publishedSlugs) {
      revalidatePath(`/blog/${slug}`);
    }
  }

  return NextResponse.json({
    message: `Published ${publishedSlugs.length} posts`,
    count: publishedSlugs.length,
    published: publishedSlugs,
    errors: errors.length > 0 ? errors : undefined,
  });
}

