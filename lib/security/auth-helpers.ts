"use server";

/**
 * Shared authentication and authorization utilities
 * Centralized auth logic for API routes and server actions
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/ssr";
import { getSupabaseServer } from "@/lib/supabase.server";
import { cookies } from "next/headers";

export type AuthResult =
  | { success: true; userId: string; user: { id: string; email?: string } }
  | { success: false; error: string; status: number };

/**
 * Verify user authentication via Supabase session
 * Returns user info if authenticated, error response if not
 */
export async function verifyAuth(
  request: NextRequest
): Promise<AuthResult> {
  try {
    const response = NextResponse.next();
    const supabase = createSupabaseRouteHandlerClient(request, response);
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Unauthorized",
        status: 401,
      };
    }

    return {
      success: true,
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  } catch {
    return {
      success: false,
      error: "Authentication failed",
      status: 401,
    };
  }
}

/**
 * Verify admin access via ADMIN_SECRET header or Supabase admin role
 */
export async function verifyAdmin(
  request: NextRequest
): Promise<AuthResult> {
  // Check ADMIN_SECRET header first (for service-to-service calls)
  const adminSecretHeader = request.headers.get("ADMIN_SECRET");
  if (adminSecretHeader && process.env.ADMIN_SECRET && adminSecretHeader === process.env.ADMIN_SECRET) {
    // Service-to-service auth - return a system user ID
    return {
      success: true,
      userId: "system",
      user: { id: "system" },
    };
  }

  // Check cookie-based admin secret
  try {
    const cookieStore = await cookies();
    const cookieSecret = cookieStore.get("ph_admin")?.value;
    if (cookieSecret && process.env.ADMIN_SECRET && cookieSecret === process.env.ADMIN_SECRET) {
      return {
        success: true,
        userId: "admin",
        user: { id: "admin" },
      };
    }
  } catch {
    // Cookie check failed
  }

  // Check Supabase session and user role
  try {
    const response = NextResponse.next();
    const supabase = createSupabaseRouteHandlerClient(request, response);
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Unauthorized",
        status: 401,
      };
    }

    // Check if user has admin role
    const serverSupabase = getSupabaseServer();
    if (serverSupabase) {
      const { data: profile } = await serverSupabase
        .from("users")
        .select("admin_role")
        .eq("id", user.id)
        .single();

      if (profile?.admin_role === true) {
        return {
          success: true,
          userId: user.id,
          user: {
            id: user.id,
            email: user.email,
          },
        };
      }
    }

    return {
      success: false,
      error: "Forbidden - Admin access required",
      status: 403,
    };
  } catch {
    return {
      success: false,
      error: "Authentication failed",
      status: 401,
    };
  }
}

/**
 * Verify provider access - user must be a provider
 */
export async function verifyProvider(
  request: NextRequest
): Promise<AuthResult> {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return authResult;
  }

  try {
    const serverSupabase = getSupabaseServer();
    if (!serverSupabase) {
      return {
        success: false,
        error: "Server configuration error",
        status: 500,
      };
    }

    // Check if user is a provider
    const { data: provider } = await serverSupabase
      .from("providers")
      .select("id")
      .eq("user_id", authResult.userId)
      .single();

    if (!provider) {
      return {
        success: false,
        error: "Forbidden - Provider access required",
        status: 403,
      };
    }

    return authResult;
  } catch {
    return {
      success: false,
      error: "Authorization check failed",
      status: 500,
    };
  }
}

/**
 * Create error response for auth failures
 */
export function createAuthErrorResponse(result: AuthResult): NextResponse {
  return NextResponse.json(
    { error: result.error },
    { status: result.status }
  );
}

