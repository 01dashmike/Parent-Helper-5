import dayjs from "dayjs";
import nodemailer from "nodemailer";
import OpenAI from "openai";
import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseServer();

    const [{ data: funnel }, { data: geo }, { data: campaigns }, { data: retention }] =
      await Promise.all([
        supabase.from("funnel_summary").select("*").order("day", { ascending: true }),
        supabase.from("geo_summary").select("*").order("signups", { ascending: false }).limit(50),
        supabase
          .from("campaign_summary")
          .select("*")
          .order("signups", { ascending: false })
          .limit(20),
        supabase
          .from("retention_summary")
          .select("*")
          .order("total_bookings", { ascending: false })
          .limit(50),
      ]);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENAI_API_KEY");
    }

    const openai = new OpenAI({ apiKey });

    const summaryPrompt = `
Summarise analytics trends for the weekly Parent Helper report.
Focus on:
- Conversions (view→signup→booking)
- Best performing towns/regions
- Retention and returning parents
- Campaign highlights
- 1 actionable improvement
Keep it under 200 words and use friendly tone.
Data:
Funnel: ${JSON.stringify((funnel ?? []).slice(-7))}
Geo: ${JSON.stringify((geo ?? []).slice(0, 10))}
Campaigns: ${JSON.stringify((campaigns ?? []).slice(0, 10))}
Retention: ${JSON.stringify((retention ?? []).slice(0, 20))}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an analytics summariser for Parent Helper." },
        { role: "user", content: summaryPrompt },
      ],
      temperature: 0.5,
      max_tokens: 400,
    });

    const aiSummary = completion.choices[0]?.message?.content?.trim() ?? "No summary available.";

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#FBF8F3;border-radius:12px;color:#1f3b3b;">
        <h2 style="color:#007A74;margin-bottom:4px;">Weekly Analytics Report</h2>
        <p style="margin:0 0 16px 0;color:#66827E;font-size:14px;">${dayjs().format("dddd, D MMMM YYYY")}</p>
        <div style="background:#ffffff;padding:18px;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.06);line-height:1.6;">
          ${aiSummary.replace(/\n/g, "<br/>")}
        </div>
        <p style="font-size:12px;color:#66827E;margin-top:18px;">
          You’re receiving this because you’re part of the Parent Helper leadership team.<br/>
          Providers can be added to future reports when personalised summaries are enabled.
        </p>
      </div>
    `;

    const emailUser = process.env.REPORT_EMAIL_USER;
    const emailPass = process.env.REPORT_EMAIL_PASS;
    const reportRecipient = process.env.REPORT_EMAIL_TO || emailUser;

    if (!emailUser || !emailPass || !reportRecipient) {
      throw new Error("Missing report email credentials");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    await transporter.sendMail({
      from: `Parent Helper Reports <${emailUser}>`,
      to: reportRecipient,
      subject: "Parent Helper Weekly Analytics Report",
      html,
    });

    return NextResponse.json({ success: true, sentTo: reportRecipient, summary: aiSummary });
  } catch (error) {
    console.error("Email report error", error);
    return NextResponse.json({ error: "Failed to send report" }, { status: 500 });
  }
}
