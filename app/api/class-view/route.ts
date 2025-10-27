import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { class_id, referrer: bodyReferrer, session_id, user_agent, user_id } = body;

    const utmHeader = req.headers.get("x-utm-data") ?? "{}";
    let utmData: Record<string, unknown> = {};
    try {
      utmData = JSON.parse(utmHeader);
    } catch (error) {
      console.warn("[class-view] failed to parse UTM header", error);
    }

    const geoHeader = req.headers.get("x-geo-data") ?? "{}";
    let geoData: Record<string, unknown> = {};
    try {
      geoData = JSON.parse(geoHeader);
    } catch (error) {
      console.warn("[class-view] failed to parse geo header", error);
    }

    if (!class_id) {
      return NextResponse.json({ error: "Missing class_id" }, { status: 400 });
    }

    const referrer = bodyReferrer ?? req.headers.get("referer") ?? null;
    const agent = user_agent ?? req.headers.get("user-agent") ?? null;

    const supabase = getSupabaseServer();

    const insertRow = {
      class_id: Number(class_id),
      referrer,
      session_id,
      user_agent: agent,
      user_id,
      source: typeof utmData.utm_source === "string" ? (utmData.utm_source as string) : null,
      utm_source: typeof utmData.utm_source === "string" ? (utmData.utm_source as string) : null,
      utm_medium: typeof utmData.utm_medium === "string" ? (utmData.utm_medium as string) : null,
      utm_campaign:
        typeof utmData.utm_campaign === "string" ? (utmData.utm_campaign as string) : null,
      utm_term: typeof utmData.utm_term === "string" ? (utmData.utm_term as string) : null,
      utm_content: typeof utmData.utm_content === "string" ? (utmData.utm_content as string) : null,
      latitude: typeof geoData.latitude === "number" ? (geoData.latitude as number) : null,
      longitude: typeof geoData.longitude === "number" ? (geoData.longitude as number) : null,
      town: typeof geoData.town === "string" ? (geoData.town as string) : null,
      region: typeof geoData.region === "string" ? (geoData.region as string) : null,
    };

    await supabase.from("class_views").insert([insertRow]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging view:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
