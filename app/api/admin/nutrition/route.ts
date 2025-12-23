export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseBrowserUrl, getSupabaseBrowserKey } from "@/lib/env";
import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase.server";
import { revalidatePath } from "next/cache";
import type { NutritionStage } from "@/lib/wellness/types";

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
  
  let authenticatedUser = user;
  
  if (!authenticatedUser) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    authenticatedUser = session?.user ?? null;
    
    if (!authenticatedUser) {
      if (process.env.NODE_ENV === "development") {
        console.error("[validateAdmin] Auth validation failed");
      }
      throw new Error("Unauthorised");
    }
  }

  // Dev override
  if (process.env.NODE_ENV === "development" && process.env.DEV_ADMIN_EMAIL) {
    if (authenticatedUser.email === process.env.DEV_ADMIN_EMAIL) {
      return { user: authenticatedUser, supabase };
    }
  }

  // Check user role
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
    throw new Error("Unauthorised");
  }

  if (userData.role !== "admin") {
    throw new Error("Unauthorised");
  }

  return { user: authenticatedUser, supabase };
}

/**
 * GET /api/admin/nutrition
 * Fetch all nutrition content (stages, foods, equipment)
 */
export async function GET(req: NextRequest) {
  try {
    await validateAdmin();
  } catch (error) {
    return NextResponse.json({ 
      error: "Forbidden", 
      message: "Authentication required" 
    }, { status: 403 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "stages";

  try {
    if (type === "stages") {
      const { data, error } = await supabase
        .from("nutrition_stages")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (type === "foods") {
      const { data, error } = await supabase
        .from("nutrition_foods")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (type === "equipment") {
      const { data, error } = await supabase
        .from("nutrition_equipment")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("[GET /api/admin/nutrition] Error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

/**
 * POST /api/admin/nutrition
 * Create or update nutrition content
 */
export async function POST(req: NextRequest) {
  try {
    await validateAdmin();
  } catch (error) {
    return NextResponse.json({ 
      error: "Forbidden", 
      message: "Authentication required" 
    }, { status: 403 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { type, action, data } = body;

    if (!type || !action || !data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const tableName = type === "stages" 
      ? "nutrition_stages" 
      : type === "foods" 
        ? "nutrition_foods" 
        : "nutrition_equipment";

    if (action === "create") {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      
      revalidatePath("/health-wellness/nutrition");
      return NextResponse.json({ ok: true, data: result });
    }

    if (action === "update") {
      if (!data.id) {
        return NextResponse.json({ error: "Missing id for update" }, { status: 400 });
      }

      const { id, ...updateData } = data;
      const { data: result, error } = await supabase
        .from(tableName)
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      revalidatePath("/health-wellness/nutrition");
      return NextResponse.json({ ok: true, data: result });
    }

    if (action === "delete") {
      if (!data.id) {
        return NextResponse.json({ error: "Missing id for delete" }, { status: 400 });
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", data.id);

      if (error) throw error;
      
      revalidatePath("/health-wellness/nutrition");
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[POST /api/admin/nutrition] Error:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}

