import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Supabase environment variables are missing");
    return NextResponse.json({ data: [] }, { status: 500 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from("seo_report_log")
    .select("sent_at, success_rate, success")
    .order("sent_at", { ascending: false })
    .limit(8);

  if (error) {
    console.error("Error fetching SEO report history:", error);
    return NextResponse.json({ data: [] });
  }

  return NextResponse.json({ data: data ?? [] });
}
