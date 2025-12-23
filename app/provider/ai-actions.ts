"use server";

/**
 * Server Actions for AI Tools
 * 
 * All AI tool actions for provider-facing features
 */

import { getSupabaseServer } from "@/lib/supabase/server";
import {
  generateClassCopy,
  improveClassCopy,
  generateScheduleSuggestions,
  generateSeoSuggestions,
  generateReviewReply,
  generateParentEmailCopy,
  generateInsightSummary,
  generateOnboardingText,
} from "@/lib/ai/providerTools";
import { z } from "zod";
import { revalidatePath } from "next/cache";

/**
 * Get current user and verify provider access
 */
async function getProviderContext(): Promise<{ userId: string; providerId: number } | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Get provider ID from user
  const { data: providerUser } = await supabase
    .from("providers_users")
    .select("provider_id")
    .eq("user_id", user.id)
    .single();

  if (!providerUser) return null;

  return {
    userId: user.id,
    providerId: providerUser.provider_id,
  };
}

/**
 * Generate class copy from scratch
 */
export async function aiGenerateClassCopy(formData: FormData) {
  const context = await getProviderContext();
  if (!context) {
    return { error: "Unauthorized" };
  }

  try {
    const data = z
      .object({
        ageRange: z.string().optional(),
        category: z.string().optional(),
        style: z.string().optional(),
        city: z.string().optional(),
        tone: z.enum(["calm", "exciting", "professional", "friendly"]).optional(),
      })
      .parse({
        ageRange: formData.get("ageRange") || undefined,
        category: formData.get("category") || undefined,
        style: formData.get("style") || undefined,
        city: formData.get("city") || undefined,
        tone: formData.get("tone") || undefined,
      });

    const result = await generateClassCopy({
      userId: context.userId,
      providerId: context.providerId,
      ...data,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("[AI Actions] Error generating class copy:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to generate class copy",
    };
  }
}

/**
 * Improve existing class copy
 */
export async function aiImproveClassCopy(formData: FormData) {
  const context = await getProviderContext();
  if (!context) {
    return { error: "Unauthorized" };
  }

  try {
    const data = z
      .object({
        existingText: z.string().min(1),
        tone: z.enum(["calm", "exciting", "professional", "friendly"]).optional(),
      })
      .parse({
        existingText: formData.get("existingText") || "",
        tone: formData.get("tone") || undefined,
      });

    const result = await improveClassCopy({
      userId: context.userId,
      providerId: context.providerId,
      ...data,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("[AI Actions] Error improving class copy:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to improve class copy",
    };
  }
}

/**
 * Generate schedule suggestions
 */
export async function aiGenerateScheduleSuggestions(formData: FormData) {
  const context = await getProviderContext();
  if (!context) {
    return { error: "Unauthorized" };
  }

  try {
    const data = z
      .object({
        ageRange: z.string().optional(),
        category: z.string().optional(),
        city: z.string().optional(),
      })
      .parse({
        ageRange: formData.get("ageRange") || undefined,
        category: formData.get("category") || undefined,
        city: formData.get("city") || undefined,
      });

    const result = await generateScheduleSuggestions({
      userId: context.userId,
      providerId: context.providerId,
      ...data,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("[AI Actions] Error generating schedule suggestions:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to generate schedule suggestions",
    };
  }
}

/**
 * Generate SEO suggestions
 */
export async function aiGenerateSeoSuggestions(formData: FormData) {
  const context = await getProviderContext();
  if (!context) {
    return { error: "Unauthorized" };
  }

  try {
    const data = z
      .object({
        currentTitle: z.string().optional(),
        currentDescription: z.string().optional(),
        category: z.string().optional(),
        city: z.string().optional(),
        ageRange: z.string().optional(),
      })
      .parse({
        currentTitle: formData.get("currentTitle") || undefined,
        currentDescription: formData.get("currentDescription") || undefined,
        category: formData.get("category") || undefined,
        city: formData.get("city") || undefined,
        ageRange: formData.get("ageRange") || undefined,
      });

    const result = await generateSeoSuggestions({
      userId: context.userId,
      providerId: context.providerId,
      ...data,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("[AI Actions] Error generating SEO suggestions:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to generate SEO suggestions",
    };
  }
}

/**
 * Suggest review reply
 */
export async function aiSuggestReviewReply(formData: FormData) {
  const context = await getProviderContext();
  if (!context) {
    return { error: "Unauthorized" };
  }

  try {
    const data = z
      .object({
        reviewText: z.string().min(1),
        reviewRating: z.coerce.number().optional(),
        tone: z.enum(["grateful", "neutral", "professional", "apologetic"]),
      })
      .parse({
        reviewText: formData.get("reviewText") || "",
        reviewRating: formData.get("reviewRating") || undefined,
        tone: formData.get("tone") || "professional",
      });

    const result = await generateReviewReply({
      userId: context.userId,
      providerId: context.providerId,
      ...data,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("[AI Actions] Error generating review reply:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to generate review reply",
    };
  }
}

/**
 * Generate parent email copy
 */
export async function aiGenerateParentEmailCopy(formData: FormData) {
  const context = await getProviderContext();
  if (!context) {
    return { error: "Unauthorized" };
  }

  try {
    const data = z
      .object({
        eventType: z.enum([
          "class_update",
          "schedule_change",
          "term_announcement",
          "holiday_special",
          "new_class",
        ]),
        tone: z.enum(["friendly", "professional", "casual"]),
        targetAge: z.string().optional(),
        city: z.string().optional(),
        keyPoints: z.string().transform((s) => s.split("\n").filter(Boolean)),
        holidayType: z.enum(["easter", "summer", "christmas", "half_term"]).optional(),
      })
      .parse({
        eventType: formData.get("eventType") || "class_update",
        tone: formData.get("tone") || "friendly",
        targetAge: formData.get("targetAge") || undefined,
        city: formData.get("city") || undefined,
        keyPoints: formData.get("keyPoints") || "",
        holidayType: formData.get("holidayType") || undefined,
      });

    const result = await generateParentEmailCopy({
      userId: context.userId,
      providerId: context.providerId,
      ...data,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("[AI Actions] Error generating email copy:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to generate email copy",
    };
  }
}

/**
 * Explain provider performance
 */
export async function aiExplainMyPerformance(formData: FormData) {
  const context = await getProviderContext();
  if (!context) {
    return { error: "Unauthorized" };
  }

  try {
    const data = z
      .object({
        timeRange: z.enum(["week", "month"]),
      })
      .parse({
        timeRange: formData.get("timeRange") || "week",
      });

    const result = await generateInsightSummary({
      userId: context.userId,
      providerId: context.providerId,
      ...data,
    });

    revalidatePath("/provider");

    return { success: true, data: result };
  } catch (error) {
    console.error("[AI Actions] Error generating insight summary:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to generate insight summary",
    };
  }
}

/**
 * Generate onboarding text
 */
export async function aiGenerateOnboardingText(formData: FormData) {
  const context = await getProviderContext();
  if (!context) {
    return { error: "Unauthorized" };
  }

  try {
    const data = z
      .object({
        step: z.enum(["tagline", "description", "captions"]),
        existingData: z.string().optional().transform((s) => (s ? JSON.parse(s) : {})),
      })
      .parse({
        step: formData.get("step") || "tagline",
        existingData: formData.get("existingData") || undefined,
      });

    const result = await generateOnboardingText({
      userId: context.userId,
      providerId: context.providerId,
      ...data,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("[AI Actions] Error generating onboarding text:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to generate onboarding text",
    };
  }
}








