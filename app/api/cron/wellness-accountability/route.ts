import { NextRequest, NextResponse } from "next/server";
import { processAccountabilityEmails } from "@/lib/wellness/accountability";

/**
 * GET /api/cron/wellness-accountability
 * 
 * Cron endpoint to process and send accountability emails
 * 
 * This should be called by:
 * - Vercel Cron Jobs (if on Vercel): Set schedule in vercel.json
 * - External cron service (e.g., cron-job.org): Call this URL on schedule
 * - Manual trigger for testing
 * 
 * Query parameters:
 * - frequency: "weekly" | "biweekly" | "monthly" (required)
 * - key: Authentication key (optional, for security)
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Check authentication key
    const { searchParams } = new URL(request.url);
    const providedKey = searchParams.get("key");
    const expectedKey = process.env.CRON_SECRET_KEY;

    if (expectedKey && providedKey !== expectedKey) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get frequency from query params
    const frequency = searchParams.get("frequency") as "weekly" | "biweekly" | "monthly" | null;

    if (!frequency || !["weekly", "biweekly", "monthly"].includes(frequency)) {
      return NextResponse.json(
        { error: "Invalid frequency. Must be 'weekly', 'biweekly', or 'monthly'" },
        { status: 400 }
      );
    }

    console.log(`[Cron] Processing ${frequency} accountability emails...`);

    // Process emails
    const result = await processAccountabilityEmails(frequency);

    console.log(`[Cron] Complete: ${result.sent} sent, ${result.failed} failed`);

    return NextResponse.json({
      success: true,
      frequency,
      sent: result.sent,
      failed: result.failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/wellness-accountability
 * 
 * Alternative method for cron services that use POST
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
