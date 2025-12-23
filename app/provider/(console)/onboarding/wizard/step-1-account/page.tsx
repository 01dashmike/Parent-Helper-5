import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { getStepData } from "@/lib/provider/onboarding";
import { Step1AccountClient } from "./Step1AccountClient";
import { WIZARD_STEPS } from "../schema";
import { checkStepAccess } from "../utils/redirectGuard";

export const dynamic = "force-dynamic";

export default async function Step1AccountPage() {
  // Check access and get provider info (includes auth, membership, step validation)
  const { providerId, session, onboardingState } = await checkStepAccess("step-1-account");

  const supabase = createSupabaseServerComponentClient();

  // Get saved data for this step
  const savedData = await getStepData(providerId, WIZARD_STEPS[0]);

  // Get provider data
  const { data: provider } = await supabase
    .from("providers")
    .select("name, contact_email, contact_phone")
    .eq("id", providerId)
    .single();

  // Pre-fill from saved data or provider record
  const providerData = provider as { name?: string; contact_email?: string; contact_phone?: string } | null;
  const savedDataTyped = savedData as { name?: string; email?: string; phone?: string } | null;
  const initialData = {
    name: savedDataTyped?.name || providerData?.name || session.user.user_metadata?.name || "",
    email: savedDataTyped?.email || providerData?.contact_email || session.user.email || "",
    phone: savedDataTyped?.phone || providerData?.contact_phone || "",
  };

  return (
    <Step1AccountClient 
      providerId={providerId} 
      initialData={initialData}
      currentStep={onboardingState.currentStep}
      isComplete={onboardingState.isComplete}
    />
  );
}

