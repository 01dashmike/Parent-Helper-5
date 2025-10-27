import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { event_type, email, postcode, source = "popup" } = await req.json();
    const utmHeader = req.headers.get("x-utm-data") ?? "{}";
    let utmData: Record<string, unknown> = {};
    try {
      utmData = JSON.parse(utmHeader);
    } catch (error) {
      console.warn("[newsletter-event] failed to parse UTM header", error);
    }

    const geoHeader = req.headers.get("x-geo-data") ?? "{}";
    let geoData: Record<string, unknown> = {};
    try {
      geoData = JSON.parse(geoHeader);
    } catch (error) {
      console.warn("[newsletter-event] failed to parse geo header", error);
    }

    const referrer = req.headers.get("referer") ?? null;
    if (!event_type) {
      return NextResponse.json({ error: "Missing event_type" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    await supabase.from("newsletter_events").insert([
      {
        event_type,
        email,
        postcode,
        source: typeof utmData.utm_source === "string" ? (utmData.utm_source as string) : source,
        referrer,
        latitude: typeof geoData.latitude === "number" ? (geoData.latitude as number) : null,
        longitude: typeof geoData.longitude === "number" ? (geoData.longitude as number) : null,
        town: typeof geoData.town === "string" ? (geoData.town as string) : null,
        region: typeof geoData.region === "string" ? (geoData.region as string) : null,
        utm_source: typeof utmData.utm_source === "string" ? (utmData.utm_source as string) : null,
        utm_medium: typeof utmData.utm_medium === "string" ? (utmData.utm_medium as string) : null,
        utm_campaign:
          typeof utmData.utm_campaign === "string" ? (utmData.utm_campaign as string) : null,
        utm_term: typeof utmData.utm_term === "string" ? (utmData.utm_term as string) : null,
        utm_content:
          typeof utmData.utm_content === "string" ? (utmData.utm_content as string) : null,
      },
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Event log failed", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
