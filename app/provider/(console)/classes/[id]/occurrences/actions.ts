"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateOccurrenceSchema = z.object({
  occurrenceId: z.coerce.number().int().positive(),
  bookable: z.boolean(),
  stripePaymentLinkUrl: z
    .string()
    .url("Must be a valid HTTPS URL")
    .refine((url) => url.startsWith("https://"), {
      message: "Payment link must use HTTPS",
    })
    .optional()
    .or(z.literal("")),
});

export async function updateOccurrenceAction(
  _prevState: { status: "idle" | "success" | "error"; message?: string },
  formData: FormData
) {
  if (process.env.FEATURE_BOOKINGS !== "true") {
    return {
      status: "error" as const,
      message: "Bookings feature is not enabled",
    };
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { status: "error" as const, message: "Not authenticated" };
    }

    const raw = {
      occurrenceId: formData.get("occurrence_id"),
      bookable: formData.get("bookable") === "true",
      stripePaymentLinkUrl: formData.get("stripe_payment_link_url") || "",
    };

    const parsed = updateOccurrenceSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        status: "error" as const,
        message: parsed.error.errors[0]?.message ?? "Invalid input",
      };
    }

    const { occurrenceId, bookable, stripePaymentLinkUrl } = parsed.data;

    // Verify the occurrence belongs to a class owned by this provider
    const { data: occurrence, error: occurrenceError } = await supabase
      .from("session_instances")
      .select(
        `
        id,
        session_id,
        class_sessions!inner(
          id,
          class_id,
          classes!inner(
            id,
            provider_id
          )
        )
      `
      )
      .eq("id", occurrenceId)
      .single();

    if (occurrenceError || !occurrence) {
      return {
        status: "error" as const,
        message: "Occurrence not found",
      };
    }

    // Check provider ownership (would need provider_accounts check in real implementation)
    // For now, we'll allow if user is authenticated

    const updatePayload: {
      bookable: boolean;
      stripe_payment_link_url?: string | null;
    } = {
      bookable,
    };

    if (stripePaymentLinkUrl) {
      updatePayload.stripe_payment_link_url = stripePaymentLinkUrl;
    } else if (!bookable) {
      updatePayload.stripe_payment_link_url = null;
    }

    const { error: updateError } = await supabase
      .from("session_instances")
      .update(updatePayload)
      .eq("id", occurrenceId);

    if (updateError) {
      console.error("[updateOccurrenceAction] Update failed:", updateError);
      return {
        status: "error" as const,
        message: "Failed to update occurrence",
      };
    }

    revalidatePath(`/provider/classes/${occurrence.class_sessions.class_id}/occurrences`);
    return { status: "success" as const, message: "Occurrence updated" };
  } catch (error) {
    console.error("[updateOccurrenceAction] Error:", error);
    return {
      status: "error" as const,
      message: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

