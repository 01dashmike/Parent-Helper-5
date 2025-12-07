import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { getActiveMembershipForUser } from "@/app/provider/_lib/membership";
import { getOnboardingState, getNextStep } from "@/lib/provider/onboarding";

export const dynamic = "force-dynamic";

/**
 * Onboarding entry point - redirects to wizard
 * 
 * Loads provider ID from session
 * Loads onboarding_state from provider_onboarding
 * If onboarding is complete → redirect to /provider
 * Else → redirect to /provider/onboarding/wizard/{current_step}
 */
export default async function OnboardingPage() {
  const supabase = createSupabaseServerComponentClient();
  const { data, error } = await supabase.auth.getSession();
  const session = data?.session ?? null;

  if (!session?.user) {
    redirect("/provider/login");
  }

  const membershipRow = await getActiveMembershipForUser(supabase, session.user.id);

  if (!membershipRow || !membershipRow.providers) {
    redirect("/provider/login");
  }

  const providerId = membershipRow.provider_id;

  // Load onboarding state (creates record if it doesn't exist)
  // This may fail if there's a type mismatch between provider_id types
  let onboardingState;
  try {
    onboardingState = await getOnboardingState(providerId);
  } catch (error) {
    console.error("[OnboardingPage] Error getting onboarding state:", error);
    // If we can't get onboarding state, redirect to first step anyway
    redirect("/provider/onboarding/wizard/step-1-account");
  }

  // If onboarding is complete, redirect to dashboard
  if (onboardingState?.isComplete) {
    redirect("/provider");
  }

  // Get current step and redirect to wizard
  try {
    const currentStep = await getNextStep(providerId);
    if (currentStep) {
      redirect(`/provider/onboarding/wizard/${currentStep}`);
    }
  } catch (error) {
    console.error("[OnboardingPage] Error getting next step:", error);
    // Fallback to first step on error
  }

  // Fallback: redirect to wizard entry
  redirect("/provider/onboarding/wizard");
}

