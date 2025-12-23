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
  
  // Get authenticated user
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();
  
  let authenticatedUser = user;
  
  if (!authenticatedUser) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    authenticatedUser = session?.user ?? null;
    
    if (!authenticatedUser) {
      // Don't log detailed auth errors in production
      if (process.env.NODE_ENV === "development") {
        console.error("[validateAdmin] Auth validation failed");
      }
      throw new Error("Unauthorised");
    }
  }

  // Dev override: allow DEV_ADMIN_EMAIL in development
  if (process.env.NODE_ENV === "development" && process.env.DEV_ADMIN_EMAIL) {
    if (authenticatedUser.email === process.env.DEV_ADMIN_EMAIL) {
      return { user: authenticatedUser, supabase };
    }
  }

  // Check user role in users table using service role client
  const serverSupabase = getSupabaseServer();
  if (!serverSupabase) {
    throw new Error("Supabase server not configured");
  }

  const { data: userData, error: userError } = await serverSupabase
    .from("users")
    .select("role")
    .eq("id", authenticatedUser.id)
    .single();

  if (userError || !userData) {
    // Don't log user IDs in production
    if (process.env.NODE_ENV === "development") {
      console.error("[validateAdmin] User not found in users table");
    }
    throw new Error("Unauthorised");
  }

  // Verify user has admin role
  if (userData.role !== "admin") {
    // Don't log user roles in production
    if (process.env.NODE_ENV === "development") {
      console.error("[validateAdmin] User does not have admin role");
    }
    throw new Error("Unauthorised");
  }

  return { user: authenticatedUser, supabase };
}

export async function POST(req: Request) {
  // Validate user is authenticated (reads from cookies)
  try {
    await validateAdmin();
  } catch (error) {
    // Don't log auth errors in production to prevent enumeration
    if (process.env.NODE_ENV === "development") {
      console.error("[POST /api/blog/admin] Auth error:", error);
    }
    return NextResponse.json({ 
      error: "Forbidden", 
      message: "Authentication required" 
    }, { status: 403 });
  }

  // Use service role client for database operations (bypasses RLS)
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
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

  if (action === "schedule") {
    const { scheduledFor } = body as { scheduledFor?: string };
    if (!scheduledFor) {
      return NextResponse.json({ error: "Missing scheduledFor" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("blog_posts_ai")
      .select("title, slug")
      .eq("id", id)
      .single();
    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const slug = await ensureUniqueSlug(supabase, data.slug || slugify(data.title), id);

    const { error: updateError } = await supabase
      .from("blog_posts_ai")
      .update({
        status: "scheduled",
        slug,
        scheduled_for: scheduledFor,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      // If scheduled_for column doesn't exist yet, tell user to run migration
      if (updateError.message?.includes("scheduled_for")) {
        return NextResponse.json({ 
          error: "Scheduling not available yet. Please run database migration first.", 
          details: "Run: npx supabase db push" 
        }, { status: 400 });
      }
      return NextResponse.json({ error: "Failed to schedule post", details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, scheduled_for: scheduledFor });
  }

  if (action === "publish") {
    const { data, error } = await supabase
      .from("blog_posts_ai")
      .select("title, slug, seo_title, seo_description, category, locality, hero_image, created_at, updated_at")
      .eq("id", id)
      .single();
    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const slug = await ensureUniqueSlug(supabase, data.slug || slugify(data.title), id);

    // Start with minimal required fields
    const updatePayload: Record<string, unknown> = {
      status: "published",
      slug,
      updated_at: new Date().toISOString(),
    };

    // Try to update with just the basic fields first
    let updateResult = await supabase
      .from("blog_posts_ai")
      .update(updatePayload)
      .eq("id", id);

    if (updateResult.error) {
      console.error("Failed to publish post:", updateResult.error);
      return NextResponse.json({ error: "Failed to update post", details: updateResult.error.message }, { status: 500 });
    }

    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
