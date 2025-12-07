"use server";

import { revalidatePath } from "next/cache";
import { createReferralCodeForUser } from "./core";

/**
 * Create or get existing referral code for a provider
 * 
 * @deprecated Use createReferralCodeForUser directly for campaign-aware code creation
 * This function is kept for backwards compatibility and uses the default campaign
 */
export async function createReferralCode(providerId: number): Promise<{
  ok: boolean;
  code?: string;
  url?: string;
  error?: string;
}> {
  try {
    // Use the new campaign-aware helper with default campaign
    const result = await createReferralCodeForUser(
      providerId,
      "provider",
      "default" // Use default campaign for backwards compatibility
    );

    if (result.ok) {
      revalidatePath("/provider/dashboard");
    }

    return result;
  } catch (error: unknown) {
    console.error("Error in createReferralCode:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: errorMessage };
  }
}

