"use server";

import { revalidatePath } from "next/cache";

/**
 * TEMP DEV STUB
 *
 * These implementations are deliberately minimal – they exist mainly so
 * that the onboarding UI renders and you can click around in dev.
 * They do NOT write anything to the database right now.
 */

export async function completeStepAction(formData: FormData) {
  // In the real version, we'd read fields from formData and update
  // provider_onboarding in Supabase.
  console.log("completeStepAction (dev stub) called", Object.fromEntries(formData));

  // Make sure the page refreshes so UI doesn't get stuck
  revalidatePath("/provider/onboarding");
}

export async function recalculateProgressAction(providerId: string | number) {
  // Real version would recompute % complete for the provider
  console.log("recalculateProgressAction (dev stub) called", providerId);

  revalidatePath("/provider/onboarding");
}


