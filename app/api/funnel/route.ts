import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const supabase = getSupabaseServer();

    const { data: funnel, error: funnelError } = await supabase
      .from("funnel_summary")
      .select("day, views, signups, bookings")
      .order("day", { ascending: false });

    if (funnelError) throw funnelError;

    const { data: retention, error: retentionError } = await supabase
      .from("retention_summary")
      .select("parent_email, first_visit, total_bookings, days_between_first_last")
      .order("days_between_first_last", { ascending: true });

    if (retentionError) throw retentionError;

    return NextResponse.json({ funnel: funnel ?? [], retention: retention ?? [] });
  } catch (error) {
    console.error("Funnel API error", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
