export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase.server";
import { slugify } from "@/lib/slug";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseBrowserUrl, getSupabaseBrowserKey } from "@/lib/env";
import { cookies } from "next/headers";

async function ensureUniqueSlug(
  supabase: SupabaseClient<any>,
  desired: string,
  excludeId?: string,
) {
  let candidate = desired || `post-${Date.now()}`;
  let suffix = 1;
  while (true) {
    const { data } = await supabase
      .from("blog_posts_ai")
      .select("id")
      .eq("slug", candidate)
      .limit(1)
      .maybeSingle();
    if (!data || (excludeId && data.id === excludeId)) {
      return candidate;
    }
    suffix += 1;
    candidate = `${desired}-${suffix}`;
  }
}

function createAuthenticatedClient() {
  const url = getSupabaseBrowserUrl();
  const key = getSupabaseBrowserKey();
  
  if (!url || !key) {
    throw new Error("Supabase environment variables not configured");
  }

  return createServerClient(url, key, {
    cookies: {
      async getAll() {
        const cookieStore = await cookies();
        return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
      },
      async setAll(cookiesToSet) {
        const cookieStore = await cookies();
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, {
            path: options?.path || "/",
            sameSite: (options?.sameSite as "lax" | "strict" | "none") || "lax",
          });
        });
      },
    },
  });
}

async function validateAdmin() {
  const supabase = createAuthenticatedClient();
  
  // Try getUser first (validates token with server)
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();
  
  if (user) {
    return { user, supabase };
  }
  
  // Fallback to getSession if getUser fails (for edge cases)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (session?.user) {
    return { user: session.user, supabase };
  }
  
  // Log errors for debugging
  console.error("Auth validation failed:", {
    getUserError: getUserError?.message,
    sessionError: sessionError?.message,
  });
  
  throw new Error("Unauthorised");
}

export async function POST(req: Request) {
  // Validate user is authenticated (reads from cookies)
  try {
    await validateAdmin();
  } catch (error) {
    console.error("Admin route auth error:", error);
    return NextResponse.json({ 
      error: "Forbidden", 
      message: error instanceof Error ? error.message : "Authentication required" 
    }, { status: 403 });
  }

  // Use service role client for database operations (bypasses RLS)
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const { action, id, updates } = body as { action?: string; id?: string; updates?: any };
  if (!action || !id) return NextResponse.json({ error: "Missing action or id" }, { status: 400 });

  if (action === "delete") {
    await supabase.from("blog_posts_ai").delete().eq("id", id);
    revalidatePath("/blog");
    return NextResponse.json({ ok: true });
  }

  if (action === "update") {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    if (typeof payload.title === "string" && !payload.slug) {
      const desired = slugify(payload.title);
      payload.slug = await ensureUniqueSlug(supabase, desired, id);
    }
    await supabase.from("blog_posts_ai").update(payload).eq("id", id);
    if (payload.status === "published") {
      revalidatePath("/blog");
      if (payload.slug) {
        revalidatePath(`/blog/${payload.slug}`);
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "publish") {
    const { data, error } = await supabase
      .from("blog_posts_ai")
      .select("title, slug, seo_title, seo_description, category, locality, hero_image, created_at, updated_at")
      .eq("id", id)
      .single();
    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const slug = await ensureUniqueSlug(supabase, data.slug || slugify(data.title), id);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://parenthelper.example";
    const heroImage = data.hero_image
      ? data.hero_image.startsWith("http")
        ? data.hero_image
        : `${baseUrl}${data.hero_image}`
      : undefined;

    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: data.seo_title || data.title,
      description: data.seo_description || data.seo_title,
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
      url: `${baseUrl}/blog/${slug}`,
      image: heroImage ? [heroImage] : undefined,
      datePublished: data.created_at ?? new Date().toISOString(),
      dateModified: new Date().toISOString(),
      articleSection: data.category,
      about: data.locality ?? undefined,
    };

    await supabase
      .from("blog_posts_ai")
      .update({
        status: "published",
        slug,
        schema_json: schema,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
