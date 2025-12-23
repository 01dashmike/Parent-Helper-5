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
  
  // Get authenticated user
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();
  
  let authenticatedUser = user;
  
  if (!authenticatedUser) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    authenticatedUser = session?.user ?? null;
    
    if (!authenticatedUser) {
      console.error("Auth validation failed:", {
        getUserError: getUserError?.message,
        sessionError: sessionError?.message,
      });
      throw new Error("Unauthorised");
    }
  }

  // Dev override: allow DEV_ADMIN_EMAIL in development (still requires email match)
  if (process.env.NODE_ENV === "development" && process.env.DEV_ADMIN_EMAIL) {
    if (authenticatedUser.email === process.env.DEV_ADMIN_EMAIL) {
      return { user: authenticatedUser, supabase };
    }
  }

  // Check user role in users table using service role client
  // This MUST pass before allowing any admin operations
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
    // Log without exposing user ID in production
    if (process.env.NODE_ENV === "development") {
      console.error("[validateAdmin] User not found in users table");
    }
    throw new Error("Unauthorised");
  }

  // CRITICAL: Verify user has admin role - reject all non-admin users
  if (userData.role !== "admin") {
    // Log without exposing user ID or role in production
    if (process.env.NODE_ENV === "development") {
      console.error("[validateAdmin] User does not have admin role");
    }
    throw new Error("Unauthorised");
  }

  return { user: authenticatedUser, supabase };
}

/**
 * GET /api/admin/about
 * Fetch about page content
 */
export async function GET(req: Request) {
  // Validate user is authenticated AND has admin role
  try {
    await validateAdmin();
  } catch (error) {
    // Don't log auth errors in production to prevent enumeration
    if (process.env.NODE_ENV === "development") {
      console.error("[GET /api/admin/about] Auth error:", error);
    }
    return NextResponse.json({ 
      error: "Forbidden", 
      message: "Authentication required" 
    }, { status: 403 });
  }

  // Use service role client for database operations
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }

  try {
    const { data, error } = await supabase
      .from("about_page_content")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) {
      console.error("[GET /api/admin/about] Database error");
      return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/admin/about] Unexpected error");
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/about
 * Update about page content
 */
export async function POST(req: Request) {
  // Validate user is authenticated AND has admin role
  try {
    await validateAdmin();
  } catch (error) {
    // Don't log auth errors in production to prevent enumeration
    if (process.env.NODE_ENV === "development") {
      console.error("[POST /api/admin/about] Auth error:", error);
    }
    return NextResponse.json({ 
      error: "Forbidden", 
      message: "Authentication required" 
    }, { status: 403 });
  }

  // Use service role client for database operations
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { updates } = body;

    if (!updates) {
      return NextResponse.json({ error: "Missing updates" }, { status: 400 });
    }

    // Filter out story_image_url_2 if column doesn't exist (migration may not have run)
    // Check if the error mentions this column and retry without it
    const updatesToApply = { ...updates };
    
    // First attempt: try with all updates
    let { data, error } = await supabase
      .from("about_page_content")
      .update({
        ...updatesToApply,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .select()
      .single();

    // If error mentions story_image_url_2 column not found, retry without it
    if (error && error.message?.includes("story_image_url_2") && error.message?.includes("schema cache")) {
      // Remove story_image_url_2 from updates and retry
      const { story_image_url_2, ...updatesWithoutSecondImage } = updatesToApply;
      
      if (process.env.NODE_ENV === "development") {
        console.warn("[POST /api/admin/about] story_image_url_2 column not found, updating without it");
      }
      
      const retryResult = await supabase
        .from("about_page_content")
        .update({
          ...updatesWithoutSecondImage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1)
        .select()
        .single();
      
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      // Show detailed error in development for debugging
      if (process.env.NODE_ENV === "development") {
        console.error("[POST /api/admin/about] Database error:", error);
        return NextResponse.json({ 
          error: "Failed to update content", 
          details: error.message,
          code: error.code 
        }, { status: 500 });
      }
      console.error("[POST /api/admin/about] Database error");
      return NextResponse.json({ error: "Failed to update content" }, { status: 500 });
    }

    // Revalidate the about page
    revalidatePath("/about");

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    // Show detailed error in development for debugging
    if (process.env.NODE_ENV === "development") {
      console.error("[POST /api/admin/about] Unexpected error:", error);
      return NextResponse.json(
        { 
          error: "Failed to update content",
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
    console.error("[POST /api/admin/about] Unexpected error");
    return NextResponse.json(
      { error: "Failed to update content" },
      { status: 500 }
    );
  }
}
