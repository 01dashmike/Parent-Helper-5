import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const emailTemplateUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  body_html: z.string().min(1).optional(),
  body_text: z.string().min(1).optional(),
  email_type: z.enum(["diet", "exercise", "supplements", "general"]).optional(),
  frequency: z.enum(["weekly", "biweekly", "monthly"]).optional(),
  is_active: z.boolean().optional(),
  scheduled_send_day: z.number().min(1).max(7).optional(),
});

/**
 * GET /api/admin/wellness/emails/[id]
 * 
 * Get a single accountability email template
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // TODO: Add admin auth check
    
    const { data, error } = await supabase
      .from("wellness_accountability_emails")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Email template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template: data });
  } catch (error) {
    console.error("[GET /api/admin/wellness/emails/[id]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/wellness/emails/[id]
 * 
 * Update an accountability email template
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // TODO: Add admin auth check
    
    const body = await request.json();
    const validation = emailTemplateUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid data" },
        { status: 400 }
      );
    }

    const data = validation.data;

    const { data: updated, error } = await supabase
      .from("wellness_accountability_emails")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !updated) {
      console.error("[PATCH /api/admin/wellness/emails/[id]] Error:", error);
      return NextResponse.json(
        { error: "Failed to update email template" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Email template updated", template: updated }
    );
  } catch (error) {
    console.error("[PATCH /api/admin/wellness/emails/[id]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/wellness/emails/[id]
 * 
 * Delete an accountability email template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // TODO: Add admin auth check
    
    const { error } = await supabase
      .from("wellness_accountability_emails")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[DELETE /api/admin/wellness/emails/[id]] Error:", error);
      return NextResponse.json(
        { error: "Failed to delete email template" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Email template deleted" }
    );
  } catch (error) {
    console.error("[DELETE /api/admin/wellness/emails/[id]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
