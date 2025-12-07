/**
 * Provider Onboarding ("Success Path") System
 * Manages onboarding steps and progress tracking
 */

import { createClient } from "@/lib/supabase/server";
import { awardXp } from "./xp";
import { awardBadge } from "./badges";

export type OnboardingStepId =
  | "upload_logo"
  | "upload_photos"
  | "add_bio"
  | "publish_class"
  | "add_schedule"
  | "add_location"
  | "preview_listing"
  | "connect_payments";

export const ONBOARDING_STEPS: Array<{
  id: OnboardingStepId;
  title: string;
  description: string;
  actionLabel: string;
  route?: string;
}> = [
  {
    id: "upload_logo",
    title: "Upload Logo",
    description: "Add your business logo to build brand recognition",
    actionLabel: "Upload Logo",
    route: "/provider/onboarding/logo",
  },
  {
    id: "upload_photos",
    title: "Upload 3 Photos",
    description: "Showcase your classes with high-quality images",
    actionLabel: "Add Photos",
    route: "/provider/onboarding/photos",
  },
  {
    id: "add_bio",
    title: "Add Short Bio",
    description: "Tell parents about your business and expertise",
    actionLabel: "Write Bio",
    route: "/provider/onboarding/bio",
  },
  {
    id: "publish_class",
    title: "Publish First Class",
    description: "Create your first class listing",
    actionLabel: "Create Class",
    route: "/provider/classes/new",
  },
  {
    id: "add_schedule",
    title: "Add Schedule",
    description: "Set up your class times and availability",
    actionLabel: "Add Schedule",
    route: "/provider/classes",
  },
  {
    id: "add_location",
    title: "Add Location",
    description: "Set your venue address and location details",
    actionLabel: "Set Location",
    route: "/provider/venues",
  },
  {
    id: "preview_listing",
    title: "Preview Listing",
    description: "Review how your listing appears to parents",
    actionLabel: "Preview",
    route: "/provider/classes",
  },
  {
    id: "connect_payments",
    title: "Connect Payments",
    description: "Enable online bookings with Stripe",
    actionLabel: "Connect Stripe",
    route: "/provider/settings/payments",
  },
];

/**
 * Get onboarding status for a provider
 */
export async function getOnboardingStatus(providerId: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("provider_onboarding")
    .select("*")
    .eq("provider_id", providerId)
    .single();

  if (error || !data) {
    return {
      isComplete: false,
      completedSteps: [] as OnboardingStepId[],
      progress: 0,
      steps: ONBOARDING_STEPS.map((step) => ({
        ...step,
        completed: false,
      })),
    };
  }

  const completedSteps = (data.completed_steps || []) as OnboardingStepId[];

  return {
    isComplete: data.is_complete,
    completedSteps,
    progress: data.progress,
    steps: ONBOARDING_STEPS.map((step) => ({
      ...step,
      completed: completedSteps.includes(step.id),
    })),
  };
}

/**
 * Get next wizard step for a provider
 * Returns the step ID they should be on, or null if complete
 */
export async function getNextWizardStep(providerId: number): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("provider_onboarding")
    .select("current_step, is_complete")
    .eq("provider_id", providerId)
    .single();

  if (error || !data) {
    // No onboarding record, start at step 1
    return "step-1-account";
  }

  if (data.is_complete) {
    return null; // Onboarding complete
  }

  // Return current step, or default to step 1
  return (data.current_step as string) || "step-1-account";
}

/**
 * Check if a step is actually completed (verify against actual data)
 */
export async function verifyOnboardingStep(
  providerId: number,
  stepId: OnboardingStepId
): Promise<boolean> {
  const supabase = await createClient();

  switch (stepId) {
    case "upload_logo": {
      const { data: provider } = await supabase
        .from("providers")
        .select("metadata")
        .eq("id", providerId)
        .single();
      const metadata = provider?.metadata as Record<string, unknown> | undefined;
      return !!(metadata?.logo_url);
    }

    case "upload_photos": {
      const { data: classes } = await supabase
        .from("classes")
        .select("image_urls")
        .eq("provider_id", providerId)
        .limit(1)
        .single();
      const images = (classes?.image_urls || "").split(",").filter(Boolean);
      return images.length >= 3;
    }

    case "add_bio": {
      const { data: provider } = await supabase
        .from("providers")
        .select("description_raw, description_override")
        .eq("id", providerId)
        .single();
      return !!(provider?.description_raw || provider?.description_override);
    }

    case "publish_class": {
      const { count } = await supabase
        .from("classes")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", providerId)
        .eq("is_active", true);
      return (count || 0) > 0;
    }

    case "add_schedule": {
      const { data: classes } = await supabase
        .from("classes")
        .select("id")
        .eq("provider_id", providerId)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (!classes) return false;

      const { count } = await supabase
        .from("class_sessions")
        .select("*", { count: "exact", head: true })
        .eq("class_id", classes.id);
      return (count || 0) > 0;
    }

    case "add_location": {
      const { data: provider } = await supabase
        .from("providers")
        .select("address_line1, postcode, latitude, longitude")
        .eq("id", providerId)
        .single();
      return !!(
        provider?.address_line1 &&
        provider?.postcode &&
        (provider?.latitude || provider?.longitude)
      );
    }

    case "preview_listing": {
      // If they have a published class, they can preview it
      const { count } = await supabase
        .from("classes")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", providerId)
        .eq("is_active", true);
      return (count || 0) > 0;
    }

    case "connect_payments": {
      const { data: provider } = await supabase
        .from("providers")
        .select("stripe_account_id, booking_enabled")
        .eq("id", providerId)
        .single();
      return !!(provider?.stripe_account_id || provider?.booking_enabled);
    }

    default:
      return false;
  }
}

/**
 * Mark an onboarding step as complete
 */
export async function completeOnboardingStep(
  providerId: number,
  stepId: OnboardingStepId
): Promise<{ success: boolean; progress: number; completed: boolean }> {
  const supabase = await createClient();

  try {
    // Verify step is actually complete
    const isComplete = await verifyOnboardingStep(providerId, stepId);
    if (!isComplete) {
      return { success: false, progress: 0, completed: false };
    }

    // Get current onboarding status
    const { data: current } = await supabase
      .from("provider_onboarding")
      .select("*")
      .eq("provider_id", providerId)
      .single();

    const completedSteps = (current?.completed_steps || []) as OnboardingStepId[];

    // Check if already completed
    if (completedSteps.includes(stepId)) {
      const progress = current?.progress || 0;
      return { success: true, progress, completed: true };
    }

    // Add step to completed list
    const newCompletedSteps = [...completedSteps, stepId];
    const progress = Math.round(
      (newCompletedSteps.length / ONBOARDING_STEPS.length) * 100
    );
    const isFullyComplete = newCompletedSteps.length === ONBOARDING_STEPS.length;

    // Update onboarding record
    if (current) {
      const { error } = await supabase
        .from("provider_onboarding")
        .update({
          completed_steps: newCompletedSteps,
          progress,
          is_complete: isFullyComplete,
          updated_at: new Date().toISOString(),
        })
        .eq("provider_id", providerId);

      if (error) {
        console.error("Error updating onboarding:", error);
        return { success: false, progress: 0, completed: false };
      }
    } else {
      const { error } = await supabase.from("provider_onboarding").insert({
        provider_id: providerId,
        completed_steps: newCompletedSteps,
        progress,
        is_complete: isFullyComplete,
      });

      if (error) {
        console.error("Error creating onboarding:", error);
        return { success: false, progress: 0, completed: false };
      }
    }

    // If fully complete, award XP and badge
    if (isFullyComplete) {
      await awardXp(providerId, "completed_onboarding");
      await awardBadge(providerId, "onboarding_complete");
    }

    return { success: true, progress, completed: isFullyComplete };
  } catch (error) {
    console.error("Error completing onboarding step:", error);
    return { success: false, progress: 0, completed: false };
  }
}

/**
 * Recalculate onboarding progress (useful for syncing)
 */
export async function recalculateOnboardingProgress(providerId: number) {
  const supabase = await createClient();

  const completedSteps: OnboardingStepId[] = [];

  // Check each step
  for (const step of ONBOARDING_STEPS) {
    const isComplete = await verifyOnboardingStep(providerId, step.id);
    if (isComplete) {
      completedSteps.push(step.id);
    }
  }

  const progress = Math.round(
    (completedSteps.length / ONBOARDING_STEPS.length) * 100
  );
  const isComplete = completedSteps.length === ONBOARDING_STEPS.length;

  // Update record
  const { data: current } = await supabase
    .from("provider_onboarding")
    .select("*")
    .eq("provider_id", providerId)
    .single();

  if (current) {
    await supabase
      .from("provider_onboarding")
      .update({
        completed_steps: completedSteps,
        progress,
        is_complete: isComplete,
        updated_at: new Date().toISOString(),
      })
      .eq("provider_id", providerId);
  } else {
    await supabase.from("provider_onboarding").insert({
      provider_id: providerId,
      completed_steps: completedSteps,
      progress,
      is_complete: isComplete,
    });
  }

  return { progress, isComplete, completedSteps };
}

