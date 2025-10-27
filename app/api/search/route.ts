import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const searchInputSchema = z
  .object({
    lat: z.number().finite().optional(),
    lng: z.number().finite().optional(),
    radiusKm: z.number().positive().max(200).optional(),
    q: z.string().max(200).optional(),
    category: z.string().max(120).optional(),
    limit: z.number().int().positive().max(100).optional(),
    offset: z.number().int().nonnegative().optional(),
  })
  .strict();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = searchInputSchema.parse(body);

    const {
      lat = null,
      lng = null,
      q = "",
      category = "",
      radiusKm = 5,
      limit = 20,
      offset = 0,
    } = parsed;

    const supabase = getSupabaseServer();

    const { data, error } = await supabase.rpc("search_classes", {
      in_lat: lat,
      in_lng: lng,
      in_radius_km: radiusKm,
      in_query: q?.trim() ?? "",
      in_category: category?.trim() ?? "",
      in_limit: limit,
      in_offset: offset,
    });

    if (error) {
      console.error("[search] Supabase RPC error:", error);
      return NextResponse.json({ error: "Search request failed" }, { status: 500 });
    }

    return NextResponse.json({ results: data ?? [] }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.flatten() },
        { status: 400 }
      );
    }

    console.error("[search] Unexpected error:", error);
    return NextResponse.json({ error: "Search request failed" }, { status: 500 });
  }
}
