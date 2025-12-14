export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseBrowserUrl, getSupabaseBrowserKey } from "@/lib/env";
import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase.server";
import { revalidatePath } from "next/cache";

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
  
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();
  
  if (user) {
    return { user, supabase };
  }
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (session?.user) {
    return { user: session.user, supabase };
  }
  
  console.error("Auth validation failed:", {
    getUserError: getUserError?.message,
    sessionError: sessionError?.message,
  });
  
  throw new Error("Unauthorised");
}

/**
 * GET /api/admin/about
 * Fetch about page content
 */
export async function GET(req: Request) {
  // Validate user is authenticated
  try {
    await validateAdmin();
  } catch (error) {
    console.error("Admin route auth error:", error);
    return NextResponse.json({ 
      error: "Forbidden", 
      message: error instanceof Error ? error.message : "Authentication required" 
    }, { status: 403 });
  }

  // Use service role client for database operations
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const { data, error } = await supabase
      .from("about_page_content")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) {
      console.error("Error fetching about page content:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error in GET /api/admin/about:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch content" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/about
 * Update about page content
 */
export async function POST(req: Request) {
  // Validate user is authenticated
  try {
    await validateAdmin();
  } catch (error) {
    console.error("Admin route auth error:", error);
    return NextResponse.json({ 
      error: "Forbidden", 
      message: error instanceof Error ? error.message : "Authentication required" 
    }, { status: 403 });
  }

  // Use service role client for database operations
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { updates } = body;

    if (!updates) {
      return NextResponse.json({ error: "Missing updates" }, { status: 400 });
    }

    // Update the about page content (id=1 is the singleton row)
    const { data, error } = await supabase
      .from("about_page_content")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .select()
      .single();

    if (error) {
      console.error("Error updating about page content:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Revalidate the about page
    revalidatePath("/about");

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("Error in POST /api/admin/about:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update content" },
      { status: 500 }
    );
  }
}
