"use server";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Verify admin access via Supabase session or ADMIN_SECRET header
 * Returns null if authorized, or an error response if not
 */
export async function verifyAdminAccess(request: NextRequest): Promise<NextResponse | null> {
  // Check ADMIN_SECRET header first (for service-to-service calls)
  const adminSecretHeader = request.headers.get("ADMIN_SECRET");
  if (adminSecretHeader && process.env.ADMIN_SECRET && adminSecretHeader === process.env.ADMIN_SECRET) {
    return null; // Authorized via header
  }

  // Check Supabase session and user role
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // Cookies are set automatically by Supabase SSR
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role in users table
    const { getSupabaseServer } = await import("@/lib/supabase.server");
    const supabase = getSupabaseServer();
    if (supabase) {
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (userData?.role === "admin") {
        return null; // Authorized
      }
    }

    // Fallback: Check cookie-based admin auth
    const cookieSecret = cookieStore.get("ph_admin")?.value;
    if (process.env.ADMIN_SECRET && cookieSecret === process.env.ADMIN_SECRET) {
      return null; // Authorized via cookie
    }
  } catch (error) {
    console.error("Admin verification error:", error);
  }

  // Not authorized
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

