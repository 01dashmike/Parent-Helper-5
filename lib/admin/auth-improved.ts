"use server";

/**
 * Admin Authentication - Supabase-based
 * 
 * Replaces legacy ADMIN_SECRET cookie-based auth.
 * Uses Supabase Auth sessions + users.role === 'admin' check.
 * 
 * Dev override: If NODE_ENV=development and user.email === DEV_ADMIN_EMAIL, allow access.
 */

import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerComponentClient, createSupabaseRouteHandlerClient } from "@/lib/supabase";
import { getSupabaseServer } from "@/lib/supabase.server";

type AdminAuthResult = {
  user: { id: string; email: string | null };
  session: { access_token: string; user: { id: string; email: string | null } };
};

/**
 * Require admin access for server components/pages
 * 
 * - Gets Supabase session
 * - Checks user role in users table
 * - Dev override: allows DEV_ADMIN_EMAIL in development
 * - Redirects to /admin/login if no session
 * - Redirects to /admin/not-authorised if not admin
 * 
 * @returns { supabase, user, session } if authorized
 * @throws redirect() if not authorized
 */
export async function requireAdminServerComponent(): Promise<AdminAuthResult> {
  const supabase = createSupabaseServerComponentClient();
  
  // Get session
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const session = sessionData?.session;

  if (sessionError || !session?.user) {
    console.log("[requireAdminServerComponent] No session, redirecting to login");
    redirect("/admin/login");
  }

  const user = session.user;

  // Dev override: allow DEV_ADMIN_EMAIL in development
  if (process.env.NODE_ENV === "development" && process.env.DEV_ADMIN_EMAIL) {
    if (user.email === process.env.DEV_ADMIN_EMAIL) {
      console.log("[requireAdminServerComponent] Dev override granted for:", user.email);
      return {
        user: { id: user.id, email: user.email ?? null },
        session: {
          access_token: session.access_token,
          user: { id: user.id, email: user.email ?? null },
        },
      };
    }
  }

  // Check user role in users table
  const serverSupabase = getSupabaseServer();
  if (!serverSupabase) {
    console.error("[requireAdminServerComponent] Supabase server not configured");
    redirect("/admin/login");
  }

  const { data: userData, error: userError } = await serverSupabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userError || !userData) {
    console.log("[requireAdminServerComponent] User not found in users table:", user.id);
    redirect("/admin/not-authorised");
  }

  // Check if user is admin
  if (userData.role !== "admin") {
    console.log("[requireAdminServerComponent] User is not admin, role:", userData.role);
    redirect("/admin/not-authorised");
  }

  return {
    user: { id: user.id, email: user.email ?? null },
    session: {
      access_token: session.access_token,
      user: { id: user.id, email: user.email ?? null },
    },
  };
}

/**
 * Require admin access for API route handlers
 * 
 * - Gets Supabase session from request
 * - Checks user role in users table
 * - Dev override: allows DEV_ADMIN_EMAIL in development
 * - Returns 401/403 JSON if not authorized
 * 
 * @param request - NextRequest object
 * @param response - NextResponse object (for cookie handling)
 * @returns { supabase, user, session } if authorized, or null if not
 */
export async function requireAdminRoute(
  request: NextRequest,
  response: NextResponse
): Promise<AdminAuthResult | null> {
  try {
    const supabase = createSupabaseRouteHandlerClient(request, response);
    
    // Get session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (sessionError || !session?.user) {
      return null;
    }

    const user = session.user;

    // Dev override: allow DEV_ADMIN_EMAIL in development
    if (process.env.NODE_ENV === "development" && process.env.DEV_ADMIN_EMAIL) {
      if (user.email === process.env.DEV_ADMIN_EMAIL) {
        console.log("[requireAdminRoute] Dev override granted for:", user.email);
        return {
          user: { id: user.id, email: user.email ?? null },
          session: {
            access_token: session.access_token,
            user: { id: user.id, email: user.email ?? null },
          },
        };
      }
    }

    // Check user role in users table
    const serverSupabase = getSupabaseServer();
    if (!serverSupabase) {
      return null;
    }

    const { data: userData, error: userError } = await serverSupabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return null;
    }

    // Check if user is admin
    if (userData.role !== "admin") {
      return null;
    }

    return {
      user: { id: user.id, email: user.email ?? null },
      session: {
        access_token: session.access_token,
        user: { id: user.id, email: user.email ?? null },
      },
    };
  } catch (error) {
    console.error("[requireAdminRoute] Error:", error);
    return null;
  }
}

/**
 * Legacy function for API routes (returns NextResponse for errors)
 * Kept for backward compatibility with existing routes
 */
export async function requireAdmin(
  request: NextRequest
): Promise<NextResponse | null> {
  const response = new NextResponse();
  const authResult = await requireAdminRoute(request, response);
  
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  return null;
}

/**
 * Get current admin user ID (for API routes)
 */
export async function getAdminUserId(request: NextRequest): Promise<string | null> {
  const response = new NextResponse();
  const authResult = await requireAdminRoute(request, response);
  return authResult?.user.id || null;
}

/**
 * Legacy function - verify admin access (returns boolean)
 * Kept for backward compatibility
 */
export async function verifyAdminAccess(
  request: NextRequest
): Promise<{ authorized: boolean; userId?: string; response?: NextResponse }> {
  const response = new NextResponse();
  const authResult = await requireAdminRoute(request, response);
  
  if (!authResult) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  
  return {
    authorized: true,
    userId: authResult.user.id,
  };
}
