export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase.server";

/**
 * GET /api/categories
 * Returns all unique categories from the classes table
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 500 }
      );
    }

    // Fetch distinct categories from classes table
    const { data, error } = await supabase
      .from("classes")
      .select("category")
      .eq("is_active", true)
      .not("category", "is", null)
      .order("category", { ascending: true });

    if (error) {
      console.error("[GET /api/categories] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: 500 }
      );
    }

    // Extract unique categories and filter out empty strings
    const uniqueCategories = [
      ...new Set(
        (data ?? [])
          .map((row: { category?: string }) => row.category?.trim())
          .filter((cat): cat is string => Boolean(cat))
      ),
    ].sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      success: true,
      categories: uniqueCategories,
      count: uniqueCategories.length,
    });
  } catch (error) {
    console.error("[GET /api/categories] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

