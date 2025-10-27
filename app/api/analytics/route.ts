import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const supabase = getSupabaseServer();

    const { data: newsletter } = await supabase
      .from("newsletter_summary")
      .select("date, impressions, signups")
      .order("date", { ascending: true });

    const { data: classViews } = await supabase.rpc("get_class_view_summary");
    const { data: campaigns } = await supabase
      .from("campaign_summary")
      .select("utm_campaign, utm_source, utm_medium, views, signups, conversion")
      .order("signups", { ascending: false });

    const newsletterRows = newsletter ?? [];
    const classViewSummaryRows = classViews ?? [];

    const impressions = newsletterRows.reduce(
      (total: number, row: { impressions?: number }) => total + (row.impressions || 0),
      0
    );
    const signups = newsletterRows.reduce(
      (total: number, row: { signups?: number }) => total + (row.signups || 0),
      0
    );
    const totalViews = classViewSummaryRows.reduce(
      (total: number, row: { views?: number }) => total + (row.views || 0),
      0
    );
    const conversion = impressions > 0 ? Number(((signups / impressions) * 100).toFixed(1)) : 0;

    const { data: classViewEventsData } = await supabase
      .from("class_views")
      .select("class_id")
      .limit(5000);

    const classViewEvents = classViewEventsData ?? [];
    const classTotals = new Map<number, number>();
    for (const row of classViewEvents) {
      const classId = Number((row as { class_id?: number }).class_id ?? NaN);
      if (!Number.isFinite(classId)) continue;
      classTotals.set(classId, (classTotals.get(classId) ?? 0) + 1);
    }

    const topClasses = Array.from(classTotals.entries())
      .map(([class_id, views]) => ({ class_id, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    return NextResponse.json({
      newsletter: newsletterRows,
      classViews: classViewSummaryRows,
      summary: {
        impressions,
        signups,
        conversion,
        totalViews,
        topClasses,
        campaigns: campaigns ?? [],
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
