import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { getActiveMembershipForUser } from "@/app/provider/_lib/membership";
import { getOnboardingState } from "@/lib/provider/onboarding";
import type { WizardStepId } from "@/lib/provider/onboarding";

const STEP_ORDER: Record<WizardStepId, number> = {
  "step-1-account": 1,
  "step-2-business": 2,
  "step-3-class": 3,
  "step-4-media": 4,
  "step-5-preview": 5,
  "step-6-publish": 6,
  "complete": 7,
};

/**
 * Server-side redirect guard for wizard steps
 * Ensures user is authenticated, has membership, and is on the correct step
 */
export async function checkStepAccess(requestedStepId: WizardStepId) {
  const supabase = createSupabaseServerComponentClient();
  const { data, error } = await supabase.auth.getSession();
  const session = data?.session ?? null;

  // 1. Check authentication
  if (error || !session?.user) {
    redirect("/provider/login");
  }

  // 2. Check provider membership
  const membershipRow = await getActiveMembershipForUser(supabase, session.user.id);
  if (!membershipRow || !membershipRow.providers) {
    redirect("/provider/login");
  }

  const providerId = membershipRow.provider_id;

  // 3. Get onboarding state
  const onboardingState = await getOnboardingState(providerId);

  // 4. If onboarding is complete, redirect to dashboard
  if (onboardingState.isComplete) {
    redirect("/provider");
  }

  // 5. Check if user is trying to skip ahead
  const currentStepOrder = STEP_ORDER[onboardingState.currentStep || "step-1-account"];
  const requestedStepOrder = STEP_ORDER[requestedStepId];

  if (requestedStepOrder > currentStepOrder) {
    // User trying to skip ahead - redirect to current step
    redirect(`/provider/onboarding/wizard/${onboardingState.currentStep || "step-1-account"}`);
  }

  return {
    providerId,
    onboardingState,
    session,
  };
}

