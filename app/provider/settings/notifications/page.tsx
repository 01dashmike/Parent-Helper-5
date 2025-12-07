import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import ProviderNotificationSettingsForm from "@/components/provider/notifications/NotificationSettingsForm";

export default async function ProviderNotificationSettingsPage() {
  const supabase = createSupabaseServerComponentClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/provider/login");
  }

  // Get current settings
  const { data: settings } = await supabase
    .from("user_notification_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <ProviderNotificationSettingsForm
      userId={user.id}
      initialSettings={settings || undefined}
    />
  );
}


