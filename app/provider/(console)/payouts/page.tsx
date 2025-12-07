import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { getActiveMembershipForUser } from "../../_lib/membership";
import PayoutsClient from "./PayoutsClient";

// Revalidate every 10 minutes - payout data doesn't change frequently
export const revalidate = 600;

export default async function ProviderPayoutsPage() {
  // Check feature flag
  if (process.env.PROVIDER_PAYOUTS_ENABLED !== "true") {
    redirect("/provider");
  }

  const supabase = createSupabaseServerComponentClient();
  const { data, error } = await supabase.auth.getSession();
  const session = data?.session ?? null;

  if (!session?.user) {
    redirect("/provider/login");
  }

  const membership = await getActiveMembershipForUser(supabase, session.user.id);
  if (!membership?.providers) {
    redirect("/provider/login");
  }

  const providerId = membership.provider_id;

  return <PayoutsClient providerId={providerId} />;
}

