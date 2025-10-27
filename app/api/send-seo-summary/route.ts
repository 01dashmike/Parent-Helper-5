import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";

export async function GET() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Supabase environment variables are missing");
    return NextResponse.json({ error: "Supabase credentials missing" }, { status: 500 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await supabase
      .from("sitemap_pings")
      .select("*")
      .gte("timestamp", dayjs().subtract(7, "day").toISOString());

    if (error) {
      console.error("Error fetching ping data:", error);
      throw error;
    }

    const engines = ["Google", "Bing"] as const;
    const summary = engines.map((engine) => {
      const entries = (data ?? []).filter((d) => d.engine === engine);
      const successRate =
        entries.length > 0 ? (entries.filter((d) => d.success).length / entries.length) * 100 : 0;
      return {
        engine,
        total: entries.length,
        successRate,
      };
    });

    const avgSuccessRate =
        summary.length > 0 ? summary.reduce((acc, item) => acc + item.successRate, 0) / summary.length : 0;

    const html = `
      <div style="font-family:Arial,sans-serif;padding:24px;background:#f9fafb;">
        <h2 style="color:#0f766e;">🌿 Parent Helper SEO Health Report</h2>
        <p>This summary covers sitemap ping performance for the past 7 days.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <tr style="background:#14b8a6;color:white;">
            <th style="text-align:left;padding:8px;">Engine</th>
            <th style="padding:8px;">Total Pings</th>
            <th style="padding:8px;">Success Rate</th>
          </tr>
          ${summary
            .map(
              (s) => `
            <tr style="background:white;border-bottom:1px solid #eee;">
              <td style="padding:8px;">${s.engine}</td>
              <td style="padding:8px;text-align:center;">${s.total}</td>
              <td style="padding:8px;text-align:center;color:${s.successRate >= 90 ? "#16a34a" : "#dc2626"}">${s.successRate.toFixed(1)}%</td>
            </tr>
          `
            )
            .join("")}
        </table>
        <p style="margin-top:24px;color:#475569;">
          Last updated: ${dayjs().format("YYYY-MM-DD HH:mm")} UTC
        </p>
        <p style="margin-top:16px;font-size:12px;color:#94a3b8;">
          © ${dayjs().year()} Parent Helper | Automated SEO Health Monitor
        </p>
      </div>
    `;

    if (!process.env.REPORT_EMAIL_USER || !process.env.REPORT_EMAIL_PASS || !process.env.REPORT_EMAIL_TO) {
      console.error("Email credentials are missing");
      throw new Error("Email credentials missing");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.REPORT_EMAIL_USER,
        pass: process.env.REPORT_EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Parent Helper Reports" <${process.env.REPORT_EMAIL_USER}>`,
      to: process.env.REPORT_EMAIL_TO,
      subject: "Weekly SEO Health Summary",
      html,
    });

    await supabase.from("seo_report_log").insert([{ success: true, success_rate: avgSuccessRate }]);

    return NextResponse.json({
      success: true,
      summary: summary.map((item) => ({
        ...item,
        successRate: item.successRate.toFixed(1),
      })),
    });
  } catch (err) {
    console.error("Error sending SEO summary:", err);
    await supabase.from("seo_report_log").insert([{ success: false, success_rate: 0 }]);
    return NextResponse.json({ error: "Failed to send report" }, { status: 500 });
  }
}
