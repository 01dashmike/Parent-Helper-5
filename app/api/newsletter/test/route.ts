/**
 * Test Newsletter Route
 * 
 * Sends a test newsletter email using SendGrid.
 * Only works in development mode or with proper authentication.
 * 
 * GET /api/newsletter/test?to=email@example.com
 */

import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Only allow in development or with proper auth
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test route only available in development" },
      { status: 403 }
    );
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "SENDGRID_API_KEY not configured" },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const to = searchParams.get("to") || "test@example.com";

  try {
    sgMail.setApiKey(apiKey);

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@parenthelper.co.uk",
      subject: "Test Newsletter from Parent Helper",
      text: "This is a test newsletter email from Parent Helper.",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #9BAE82;">Parent Helper Test Newsletter</h1>
          <p>This is a test newsletter email to verify SendGrid integration is working.</p>
          <p>If you received this email, the newsletter system is configured correctly!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This is a test email sent from the Parent Helper development environment.
          </p>
        </div>
      `,
    };

    await sgMail.send(msg);

    return NextResponse.json({
      success: true,
      message: `Test newsletter sent to ${to}`,
    });
  } catch (error: any) {
    console.error("SendGrid error:", error);
    return NextResponse.json(
      {
        error: "Failed to send test newsletter",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
