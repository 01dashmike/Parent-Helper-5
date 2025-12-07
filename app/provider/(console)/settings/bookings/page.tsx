import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import ProviderBookingSettingsClient from "./ProviderBookingSettingsClient";

export default async function ProviderBookingSettingsPage() {
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

  // Get current settings
  const { data: settings } = await supabase
    .from("provider_booking_settings")
    .select("*")
    .eq("provider_id", providerId)
    .is("class_id", null) // Provider-wide settings
    .single();

  return (
    <ProviderBookingSettingsClient
      providerId={providerId}
      initialSettings={settings || undefined}
    />
  );
}


