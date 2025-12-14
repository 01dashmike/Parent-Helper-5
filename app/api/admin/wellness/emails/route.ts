import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const emailTemplateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subject: z.string().min(1, "Subject is required"),
  body_html: z.string().min(1, "HTML body is required"),
  body_text: z.string().min(1, "Text body is required"),
  email_type: z.enum(["diet", "exercise", "supplements", "general"]),
  frequency: z.enum(["weekly", "biweekly", "monthly"]),
  is_active: z.boolean().default(true),
  scheduled_send_day: z.number().min(1).max(7).optional(),
});

/**
 * GET /api/admin/wellness/emails
 * 
 * Get all accountability email templates
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin auth check
    
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    let query = supabase
      .from("wellness_accountability_emails")
      .select("*")
      .order("created_at", { ascending: false });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[GET /api/admin/wellness/emails] Error:", error);
      return NextResponse.json(
        { error: "Failed to fetch email templates" },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: data });
  } catch (error) {
    console.error("[GET /api/admin/wellness/emails] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/wellness/emails
 * 
 * Create a new accountability email template
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin auth check
    
    const body = await request.json();
    const validation = emailTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid data" },
        { status: 400 }
      );
    }

    const data = validation.data;

    const { data: inserted, error } = await supabase
      .from("wellness_accountability_emails")
      .insert({
        ...data,
        created_by: "admin", // TODO: Get actual admin user
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/admin/wellness/emails] Error:", error);
      return NextResponse.json(
        { error: "Failed to create email template" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Email template created", template: inserted },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/admin/wellness/emails] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
