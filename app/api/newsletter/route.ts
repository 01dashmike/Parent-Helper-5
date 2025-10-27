import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServer } from "@/lib/supabaseServer";
import { geocodePostcode } from "@/lib/geocode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const newsletterSchema = z
  .object({
    email: z.string().email(),
    postcode: z.string().max(16).optional(),
  })
  .strict();

export async function POST(request: Request) {
  const utmHeader = request.headers.get("x-utm-data") ?? "{}";
  let utmData: Record<string, unknown> = {};
  try {
    utmData = JSON.parse(utmHeader);
  } catch (error) {
    console.warn("[newsletter] failed to parse UTM header", error);
  }

  let parsed: z.infer<typeof newsletterSchema>;
  try {
    const body = await request.json();
    parsed = newsletterSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase.from("newsletters").insert({
      email: parsed.email.toLowerCase(),
      postcode: parsed.postcode ?? null,
      is_active: true,
    });

    if (error) {
      if ("code" in error && error.code === "23505") {
        return NextResponse.json({ error: "Email already subscribed" }, { status: 409 });
      }

      console.error("[newsletter] Supabase insert error:", error);
      return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
    }

    const location = parsed.postcode ? await geocodePostcode(parsed.postcode) : null;

    const referrer = request.headers.get("referer") ?? null;
    const utmSource =
      typeof utmData.utm_source === "string" ? (utmData.utm_source as string) : null;
    const utmPayload = {
      utm_source: utmSource,
      utm_medium: typeof utmData.utm_medium === "string" ? (utmData.utm_medium as string) : null,
      utm_campaign:
        typeof utmData.utm_campaign === "string" ? (utmData.utm_campaign as string) : null,
      utm_term: typeof utmData.utm_term === "string" ? (utmData.utm_term as string) : null,
      utm_content: typeof utmData.utm_content === "string" ? (utmData.utm_content as string) : null,
    };

    await supabase.from("newsletter_events").insert([
      {
        event_type: "signup",
        email: parsed.email.toLowerCase(),
        postcode: parsed.postcode ?? null,
        referrer,
        source: utmSource ?? "popup",
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        town: location?.town ?? null,
        region: location?.region ?? null,
        ...utmPayload,
      },
    ]);

    return NextResponse.json({ success: true, location }, { status: 200 });
  } catch (error) {
    console.error("[newsletter] Unexpected error:", error);
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }
}
