import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key for server-side operations
// This bypasses RLS for trusted server-side inserts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Valid event types for validation
const VALID_EVENT_TYPES = [
  "search",
  "map_interaction",
  "blog_view",
  "class_interaction",
  "filter_change",
  "page_view",
  "blog_published_from_trend",
];

/**
 * POST /api/analytics
 * 
 * Accepts batched analytics events and stores them in Supabase
 * 
 * Privacy-first approach:
 * - No personal data stored
 * - Anonymous session IDs only
 * - 90-day retention policy enforced
 * - No cookies used
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events } = body;

    // Validate input
    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "Invalid events array" },
        { status: 400 }
      );
    }

    // Validate each event
    const validEvents = events
      .filter((event) => {
        // Check event structure
        if (!event.eventType || !event.payload) return false;

        // Check event type is valid
        if (!VALID_EVENT_TYPES.includes(event.eventType)) return false;

        // Check session ID exists
        if (!event.payload.sessionId) return false;

        return true;
      })
      .map((event) => ({
        event_type: event.eventType,
        payload: event.payload,
        created_at: new Date().toISOString(),
      }));

    if (validEvents.length === 0) {
      return NextResponse.json(
        { error: "No valid events to insert" },
        { status: 400 }
      );
    }

    // Insert events into Supabase
    const { data, error } = await supabase
      .from("analytics_events")
      .insert(validEvents);

    if (error) {
      console.error("Analytics insert error:", error);
      return NextResponse.json(
        { error: "Failed to insert events" },
        { status: 500 }
      );
    }

    // Return success
    return NextResponse.json(
      {
        success: true,
        inserted: validEvents.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics
 * 
 * For admin dashboard - returns aggregated analytics
 * TODO: Add authentication check
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check here
    // For now, return basic stats

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get all events from the last N days
    const { data: events, error } = await supabase
      .from("analytics_events")
      .select("*")
      .gte("created_at", cutoffDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Analytics query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch analytics" },
        { status: 500 }
      );
    }

    return NextResponse.json({ events, count: events?.length || 0 });
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

