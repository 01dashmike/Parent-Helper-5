export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase.server";
import { publicApiLimiter, applyRateLimit } from "@/lib/ratelimit";

// Input validation schema with security limits
const searchParamsSchema = z.object({
  q: z.string().max(200, "Search query too long").optional().default(""),
  category: z.string().max(50, "Category too long").optional().default(""),
  day: z.coerce.number().int().min(0).max(6).optional(),
  minAge: z.coerce.number().int().min(0).max(240).optional(),
  maxAge: z.coerce.number().int().min(0).max(240).optional(),
  fromTime: z.string().max(10).regex(/^([0-9]{2}:[0-9]{2})?$/, "Invalid time format").optional().default(""),
  toTime: z.string().max(10).regex(/^([0-9]{2}:[0-9]{2})?$/, "Invalid time format").optional().default(""),
  lat: z.coerce.number().min(-90).max(90).optional().default(0),
  lng: z.coerce.number().min(-180).max(180).optional().default(0),
  radiusKm: z.coerce.number().min(1).max(100).optional().default(20),
});

export async function GET(req: NextRequest) {
  // Apply rate limiting
  const rateLimitError = await applyRateLimit(req, publicApiLimiter);
  if (rateLimitError) {
    return rateLimitError;
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Service unavailable" },
      { status: 500 },
    );
  }

  // Parse and validate search parameters
  const { searchParams } = new URL(req.url);
  const rawParams = {
    q: searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    day: searchParams.get("day") ?? undefined,
    minAge: searchParams.get("minAge") ?? undefined,
    maxAge: searchParams.get("maxAge") ?? undefined,
    fromTime: searchParams.get("fromTime") ?? undefined,
    toTime: searchParams.get("toTime") ?? undefined,
    lat: searchParams.get("lat") ?? undefined,
    lng: searchParams.get("lng") ?? undefined,
    radiusKm: searchParams.get("radiusKm") ?? undefined,
  };

  const validation = searchParamsSchema.safeParse(rawParams);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid search parameters", details: validation.error.issues },
      { status: 400 },
    );
  }

  const { q, category, day, minAge, maxAge, fromTime, toTime, lat: centerLat, lng: centerLng, radiusKm } = validation.data;

  let query = supabase.from("classes_test_andover").select("*");

  if (q) query = query.ilike("class_name", `%${q}%`);
  if (category) query = query.eq("category", category);
  if (day) query = query.eq("day_of_week", Number(day));
  if (fromTime) query = query.gte("start_time", fromTime);
  if (toTime) query = query.lte("end_time", toTime);

  const { data, error } = await query.limit(200);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const toRad = (x: number) => (x * Math.PI) / 180;
  const withinRadius = (lat: number, lng: number) => {
    if (!centerLat || !centerLng) return true;
    const R = 6371;
    const dLat = toRad(lat - centerLat);
    const dLng = toRad(lng - centerLng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(centerLat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
    const distance = 2 * R * Math.asin(Math.sqrt(a));
    return distance <= radiusKm;
  };

  const filtered = (data ?? []).filter((row: any) => {
    const ageMin = typeof minAge === "number" && !Number.isNaN(minAge) ? minAge : undefined;
    const ageMax = typeof maxAge === "number" && !Number.isNaN(maxAge) ? maxAge : undefined;
    const rowMin = typeof row.min_age_months === "number" ? row.min_age_months : 0;
    const rowMax = typeof row.max_age_months === "number" ? row.max_age_months : 999;

    const ageMatches = (() => {
      if (ageMin === undefined && ageMax === undefined) return true;
      const lowerOk = ageMax === undefined ? true : rowMin <= ageMax;
      const upperOk = ageMin === undefined ? true : rowMax >= ageMin;
      return lowerOk && upperOk;
    })();

    const locationMatches = (() => {
      if (centerLat && centerLng && row.latitude && row.longitude) {
        return withinRadius(row.latitude, row.longitude);
      }
      return true;
    })();

    return ageMatches && locationMatches;
  });

  return NextResponse.json({ results: filtered });
}
