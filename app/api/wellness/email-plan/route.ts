import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/emails/send";
import { 
  getMealPlanEmailTemplate, 
  getExercisePlanEmailTemplate,
  getSupplementEmailTemplate 
} from "@/lib/emails/templates/wellnessPlan";
import type { MealPlan, ExercisePlan, SupplementResult } from "@/lib/wellness/types";

const emailPlanSchema = z.object({
  email: z.string().email("Invalid email address"),
  planType: z.enum(["meal", "exercise", "supplement"]),
  audience: z.string(),
  planData: z.any(), // We'll validate the structure based on planType
});

/**
 * POST /api/wellness/email-plan
 * 
 * Email a wellness plan to a user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = emailPlanSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { email, planType, audience, planData } = validation.data;

    // Generate email based on plan type
    let emailTemplate: { subject: string; html: string; text: string };
    
    try {
      switch (planType) {
        case "meal":
          emailTemplate = getMealPlanEmailTemplate(planData as MealPlan, audience);
          break;
        case "exercise":
          emailTemplate = getExercisePlanEmailTemplate(planData as ExercisePlan, audience);
          break;
        case "supplement":
          emailTemplate = getSupplementEmailTemplate(planData as SupplementResult, audience);
          break;
        default:
          return NextResponse.json(
            { error: "Invalid plan type" },
            { status: 400 }
          );
      }
    } catch (error) {
      console.error("[POST /api/wellness/email-plan] Template generation error:", error);
      return NextResponse.json(
        { error: "Failed to generate email template" },
        { status: 500 }
      );
    }

    // Send email
    const result = await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Plan emailed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/wellness/email-plan] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
