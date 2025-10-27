import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const supabase = getSupabaseServer();
    const { data: summaryRows, error: summaryError } = await supabase
      .from("newsletter_summary")
      .select("date, impressions, signups")
      .order("date", { ascending: true });

    let daily: Array<{ date: string; impressions: number; signups: number }> = [];
    let impressions = 0;
    let signups = 0;

    if (!summaryError && summaryRows && summaryRows.length > 0) {
      daily = summaryRows.map((row) => ({
        date: row.date,
        impressions: row.impressions ?? 0,
        signups: row.signups ?? 0,
      }));
      impressions = daily.reduce((acc, row) => acc + row.impressions, 0);
      signups = daily.reduce((acc, row) => acc + row.signups, 0);
    } else {
      const { data: fallbackEvents, error: fallbackError } = await supabase
        .from("newsletter_events")
        .select("event_type, postcode, created_at")
        .order("created_at", { ascending: true });

      if (fallbackError) throw fallbackError;

      const byDate: Record<string, { impressions: number; signups: number }> = {};
      for (const event of fallbackEvents ?? []) {
        const date = new Date(event.created_at as string).toISOString().split("T")[0];
        if (!byDate[date]) byDate[date] = { impressions: 0, signups: 0 };
        if (event.event_type === "impression") {
          byDate[date].impressions += 1;
          impressions += 1;
        } else if (event.event_type === "signup") {
          byDate[date].signups += 1;
          signups += 1;
        }
      }

      daily = Object.entries(byDate).map(([date, value]) => ({
        date,
        impressions: value.impressions,
        signups: value.signups,
      }));
    }

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data: postcodeRows, error: postcodeError } = await supabase
      .from("newsletter_events")
      .select("postcode")
      .eq("event_type", "signup")
      .gte("created_at", since.toISOString());

    if (postcodeError) throw postcodeError;

    const postcodeMap: Record<string, number> = {};
    for (const row of postcodeRows ?? []) {
      const postcode = row.postcode;
      if (!postcode) continue;
      postcodeMap[postcode] = (postcodeMap[postcode] || 0) + 1;
    }

    const topPostcodes = Object.entries(postcodeMap)
      .map(([postcode, count]) => ({ postcode, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 9);

    const conversion = impressions > 0 ? Number(((signups / impressions) * 100).toFixed(1)) : 0;

    return NextResponse.json({
      daily,
      summary: { impressions, signups, conversion, topPostcodes },
    });
  } catch (error) {
    console.error("Newsletter analytics error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
