import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { subscribeToNewsletter } from "@/lib/wellness/newsletter";

const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * POST /api/newsletter/subscribe
 * 
 * Subscribe an email address to the newsletter
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = subscribeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid email" },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    const result = await subscribeToNewsletter(email);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to subscribe" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Successfully subscribed to newsletter" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/newsletter/subscribe] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
