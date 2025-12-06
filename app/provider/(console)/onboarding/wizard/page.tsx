import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { getActiveMembershipForUser } from "@/app/provider/_lib/membership";
import { getCurrentWizardStep } from "./actions";

export const dynamic = "force-dynamic";

/**
 * Wizard entry point - redirects to current step
 */
export default async function WizardEntryPage() {
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

  // Check if onboarding is already complete
  const { data: onboarding } = await supabase
    .from("provider_onboarding")
    .select("is_complete")
    .eq("provider_id", providerId)
    .single();

  if (onboarding?.is_complete) {
    // Onboarding complete, redirect to dashboard
    redirect("/provider");
  }

  // Get current step and redirect
  const currentStep = await getCurrentWizardStep(providerId);
  redirect(`/provider/onboarding/wizard/${currentStep}`);
}

