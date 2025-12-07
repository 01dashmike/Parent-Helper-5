"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerActionClient } from "@/lib/supabase";
import { getActiveMembershipForUser } from "../../_lib/membership";
import type { ActionState } from "./state";
import { classFormSchema, occurrenceFormSchema } from "./schema";

async function resolveProviderContext() {
  const supabase = createSupabaseServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." as const };
  }

  const membership = await getActiveMembershipForUser(supabase, user.id);
  if (!membership || !membership.providers) {
    return { error: "No active provider assigned." as const };
  }

  return {
    supabase,
    providerId: membership.provider_id,
  };
}

export async function createClassAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const context = await resolveProviderContext();
    if ("error" in context) {
      return { status: "error", message: context.error };
    }

    const raw = {
      title: formData.get("title"),
      summary: formData.get("summary"),
      price: formData.get("price"),
      bookingUrl: formData.get("booking_url"),
      venueId: formData.get("venue_id"),
      tags: formData.get("tags"),
      isPublished: formData.get("is_published") ? "true" : "false",
    };

    const parsed = classFormSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Invalid class details.",
      };
    }

    const { supabase, providerId } = context;
    const payload = parsed.data;

    const { data: newClass, error } = await supabase.from("classes").insert({
      provider_id: providerId,
      venue_id: payload.venueId,
      title: payload.title,
      summary: payload.summary || null,
      price: payload.price || null,
      booking_url: payload.bookingUrl ?? null,
      is_published: payload.isPublished ?? false,
      tags: payload.tags ?? [],
    }).select("id").single();

    if (error) {
      return {
        status: "error",
        message: error.message ?? "Unable to create class.",
      };
    }

    // Award onboarding reward if this is the first published class and step 2 is complete
    if (payload.isPublished && newClass?.id) {
      try {
        const { awardOnboardingReward } = await import("@/lib/provider/onboardingReward");
        await awardOnboardingReward(providerId, newClass.id);
        // Don't fail class creation if reward fails
      } catch (rewardError) {
        console.error("[createClassAction] Failed to award onboarding reward:", rewardError);
      }
    }

    revalidatePath("/provider/classes");
    return { status: "success", message: "Class created." };
  } catch (error: any) {
    console.error("[createClassAction] failed:", error);
    return {
      status: "error",
      message: error?.message ?? "Unexpected error creating class.",
    };
  }
}

export async function updateClassAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const context = await resolveProviderContext();
    if ("error" in context) {
      return { status: "error", message: context.error };
    }

    const classId = formData.get("class_id");
    if (typeof classId !== "string" || classId.length === 0) {
      return { status: "error", message: "Class identifier missing." };
    }

    const raw = {
      title: formData.get("title"),
      summary: formData.get("summary"),
      price: formData.get("price"),
      bookingUrl: formData.get("booking_url"),
      venueId: formData.get("venue_id"),
      tags: formData.get("tags"),
      isPublished: formData.get("is_published") ? "true" : "false",
    };

    const parsed = classFormSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Invalid class details.",
      };
    }

    const { supabase } = context;
    const payload = parsed.data;

    const { error } = await supabase
      .from("classes")
      .update({
        title: payload.title,
        summary: payload.summary || null,
        price: payload.price || null,
        booking_url: payload.bookingUrl ?? null,
        is_published: payload.isPublished ?? false,
        tags: payload.tags ?? [],
        venue_id: payload.venueId,
      })
      .eq("id", classId);

    if (error) {
      return {
        status: "error",
        message: error.message ?? "Unable to update class.",
      };
    }

    revalidatePath("/provider/classes");
    return { status: "success", message: "Class updated." };
  } catch (error: any) {
    console.error("[updateClassAction] failed:", error);
    return {
      status: "error",
      message: error?.message ?? "Unexpected error updating class.",
    };
  }
}

export async function deleteClassAction(formData: FormData) {
  try {
    const context = await resolveProviderContext();
    if ("error" in context) {
      return;
    }

    const classId = formData.get("class_id");
    if (typeof classId !== "string" || classId.length === 0) {
      return;
    }

    const { supabase } = context;
    await supabase.from("classes").delete().eq("id", classId);
  } catch (error) {
    console.error("[deleteClassAction] failed:", error);
  } finally {
    revalidatePath("/provider/classes");
  }
}

export async function createOccurrenceAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const context = await resolveProviderContext();
    if ("error" in context) {
      return { status: "error", message: context.error };
    }

    const raw = {
      classId: formData.get("class_id"),
      startsAt: formData.get("starts_at"),
      endsAt: formData.get("ends_at"),
      venueId: formData.get("venue_id"),
      status: formData.get("status") ?? "scheduled",
      price: formData.get("price"),
      bookingUrl: formData.get("booking_url"),
    };

    const parsed = occurrenceFormSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Invalid occurrence details.",
      };
    }

    const { supabase, providerId } = context;
    const payload = parsed.data;

    const { error } = await supabase.from("class_occurrences").insert({
      class_id: payload.classId,
      provider_id: providerId,
      venue_id: payload.venueId,
      starts_at: payload.startsAt,
      ends_at: payload.endsAt,
      status: payload.status,
      price: payload.price || null,
      booking_url: payload.bookingUrl,
    });

    if (error) {
      return {
        status: "error",
        message: error.message ?? "Unable to create occurrence.",
      };
    }

    revalidatePath("/provider/classes");
    return { status: "success", message: "Occurrence added." };
  } catch (error: any) {
    console.error("[createOccurrenceAction] failed:", error);
    return {
      status: "error",
      message: error?.message ?? "Unexpected error creating occurrence.",
    };
  }
}

export async function deleteOccurrenceAction(formData: FormData) {
  try {
    const context = await resolveProviderContext();
    if ("error" in context) {
      return;
    }

    const occurrenceId = formData.get("occurrence_id");
    if (typeof occurrenceId !== "string" || occurrenceId.length === 0) {
      return;
    }

    const { supabase } = context;
    await supabase.from("class_occurrences").delete().eq("id", occurrenceId);
  } catch (error) {
    console.error("[deleteOccurrenceAction] failed:", error);
  } finally {
    revalidatePath("/provider/classes");
  }
}

type RewriteSuggestion = {
  title: string;
  summary: string;
  improvements: string[];
};

export async function rewriteClassContent(
  title: string,
  summary: string | null
): Promise<{ success: true; suggestion: RewriteSuggestion } | { success: false; error: string }> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { success: false, error: "AI features are not configured." };
    }

    const currentTitle = title.trim() || "Untitled Class";
    const currentSummary = (summary || "").trim() || "No description provided.";

    const prompt = `You are a content editor helping a class provider improve their class listing for a UK baby and toddler activity platform.

Current class title: "${currentTitle}"
Current description: "${currentSummary}"

Please provide an improved version that:
1. Fixes any grammar, spelling, or punctuation errors
2. Improves clarity and readability
3. Enhances SEO with relevant keywords parents might search for
4. Maintains the original meaning and intent
5. Makes the content more engaging and professional

Return a JSON object with:
- "title": improved title (keep it concise, 60 characters or less)
- "summary": improved description (2-4 sentences, engaging and clear)
- "improvements": array of 2-4 short strings explaining what was improved (e.g., "Fixed grammar", "Added SEO keywords", "Improved clarity")

Return ONLY valid JSON, no markdown or extra text.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a helpful content editor for a UK baby and toddler activity platform. Always return valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `AI service error: ${response.status}`,
      };
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) {
      return { success: false, error: "No response from AI service." };
    }

    let parsed: RewriteSuggestion;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      return { success: false, error: "Failed to parse AI response." };
    }

    // Validate response structure
    if (!parsed.title || !parsed.summary || !Array.isArray(parsed.improvements)) {
      return { success: false, error: "Invalid response format from AI." };
    }

    return {
      success: true,
      suggestion: {
        title: parsed.title.trim(),
        summary: parsed.summary.trim(),
        improvements: parsed.improvements.filter((i: unknown) => typeof i === "string"),
      },
    };
  } catch (error: unknown) {
    console.error("[rewriteClassContent] failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error improving content.",
    };
  }
}

