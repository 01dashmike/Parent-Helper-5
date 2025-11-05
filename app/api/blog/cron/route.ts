export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase.server";

function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function GET(request: Request) {
  if (process.env.CRON_SECRET) {
    const provided = request.headers.get("x-cron-secret");
    if (provided !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const sb = getSupabaseServer();
  if (!sb) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  const frequency = process.env.BLOG_CRON_FREQUENCY ?? "daily";
  const limit = frequency === "daily" ? 1 : 1;

  const { data: topics } = await sb
    .from("blog_topics_queue")
    .select("id")
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .limit(limit);

  if (!topics?.length) {
    return NextResponse.json({ ok: true, message: "No topics pending" });
  }

  let generated = 0;
  for (const topic of topics) {
    const response = await fetch(`${siteUrl()}/api/blog/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId: topic.id }),
    });
    if (response.ok) {
      generated += 1;
    }
  }

  return NextResponse.json({ ok: true, generated });
}
