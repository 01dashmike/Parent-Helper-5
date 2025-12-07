"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { updateProviderCreditSettings } from "@/lib/wallet/providerCredits";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const settingsSchema = z.object({
  providerId: z.coerce.number().int().positive(),
  acceptsCredits: z.coerce.boolean(),
  creditCostPerClass: z.coerce.number().int().positive(),
  unlimitedPassEnabled: z.coerce.boolean(),
  unlimitedPassPrice: z.coerce.number().int().positive().optional(),
  unlimitedPassType: z.enum(["weekly", "monthly"]).optional(),
  classOverrides: z.string().transform((s) => (s ? JSON.parse(s) : {})).optional(),
});

/**
 * Save provider credit settings
 */
export async function saveCreditSettings(formData: FormData) {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return { error: "Database not configured" };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    // Verify provider membership
    const { data: providerUser } = await supabase
      .from("providers_users")
      .select("provider_id")
      .eq("user_id", user.id)
      .single();

    if (!providerUser) {
      return { error: "Provider not found" };
    }

    const payload = settingsSchema.parse({
      providerId: formData.get("providerId"),
      acceptsCredits: formData.get("acceptsCredits"),
      creditCostPerClass: formData.get("creditCostPerClass"),
      unlimitedPassEnabled: formData.get("unlimitedPassEnabled"),
      unlimitedPassPrice: formData.get("unlimitedPassPrice") || undefined,
      unlimitedPassType: formData.get("unlimitedPassType") || undefined,
      classOverrides: formData.get("classOverrides") || undefined,
    });

    if (payload.providerId !== providerUser.provider_id) {
      return { error: "Unauthorized" };
    }

    await updateProviderCreditSettings(providerUser.provider_id.toString(), {
      acceptsCredits: payload.acceptsCredits,
      creditCostPerClass: payload.creditCostPerClass,
      unlimitedPassEnabled: payload.unlimitedPassEnabled,
      unlimitedPassPrice: payload.unlimitedPassPrice,
      unlimitedPassType: payload.unlimitedPassType,
      classOverrides: payload.classOverrides,
    });

    revalidatePath("/provider/credits");
    return { success: true };
  } catch (error) {
    console.error("[saveCreditSettings] Error:", error);
    return {
      error:
        error instanceof z.ZodError
          ? error.issues.map((issue) => issue.message).join(", ")
          : "Failed to save settings",
    };
  }
}





