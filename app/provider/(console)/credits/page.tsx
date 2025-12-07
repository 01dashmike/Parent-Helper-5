import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import ProviderCreditsClient from "./ProviderCreditsClient";
import { getProviderCreditSettings } from "@/lib/wallet/providerCredits";

export default async function ProviderCreditsPage() {
  const supabase = createSupabaseServerComponentClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/provider/login");
  }

  // Get provider ID
  const { data: providerUser } = await supabase
    .from("providers_users")
    .select("provider_id")
    .eq("user_id", user.id)
    .single();

  if (!providerUser) {
    redirect("/provider/login");
  }

  const providerId = providerUser.provider_id;
  const settings = await getProviderCreditSettings(providerId);

  return <ProviderCreditsClient providerId={providerId} initialSettings={settings} />;
}

