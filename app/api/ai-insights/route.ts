import { NextResponse } from "next/server";
import OpenAI from "openai";

import { getSupabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseServer();

    const [{ data: funnel }, { data: geo }, { data: campaigns }, { data: retention }] =
      await Promise.all([
        supabase.from("funnel_summary").select("day, views, signups, bookings"),
        supabase.from("geo_summary").select("region, town, lat, lng, signups, views"),
        supabase
          .from("campaign_summary")
          .select("utm_campaign, utm_source, utm_medium, views, signups, conversion"),
        supabase
          .from("retention_summary")
          .select("parent_email, total_bookings, days_between_first_last"),
      ]);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENAI_API_KEY");
    }

    const openai = new OpenAI({ apiKey });

    const summaryPrompt = `
You are a marketing analyst for Parent Helper.
Summarise key trends concisely (≤ 200 words):
– Which campaigns have highest conversion?
– Which towns/regions perform best?
– Any retention patterns?
– Daily funnel trends.
– Suggest one actionable idea.
Data:
Funnel: ${JSON.stringify((funnel ?? []).slice(-7))}
Geo: ${JSON.stringify((geo ?? []).slice(0, 10))}
Campaigns: ${JSON.stringify((campaigns ?? []).slice(0, 10))}
Retention: ${JSON.stringify((retention ?? []).slice(0, 20))}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You analyse analytics data for a family activities platform called Parent Helper.",
        },
        { role: "user", content: summaryPrompt },
      ],
      temperature: 0.5,
      max_tokens: 400,
    });

    const insight = completion.choices[0]?.message?.content?.trim() ?? "No insight available.";

    return NextResponse.json({ summary: insight });
  } catch (error) {
    console.error("AI insight error", error);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
