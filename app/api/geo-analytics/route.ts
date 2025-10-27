import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.from("geo_summary").select("*");
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Geo analytics error", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
