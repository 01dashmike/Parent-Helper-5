export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase.server";

export async function GET(req: Request) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 },
    );
  }
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const day = searchParams.get("day");
  const minAgeRaw = searchParams.get("minAge");
  const maxAgeRaw = searchParams.get("maxAge");
  const minAge = minAgeRaw ? Number(minAgeRaw) : undefined;
  const maxAge = maxAgeRaw ? Number(maxAgeRaw) : undefined;
  const fromTime = searchParams.get("fromTime") ?? "";
  const toTime = searchParams.get("toTime") ?? "";
  const centerLat = Number(searchParams.get("lat") ?? "0");
  const centerLng = Number(searchParams.get("lng") ?? "0");
  const radiusKm = Number(searchParams.get("radiusKm") ?? "20");

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
