import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import ProviderBookingsClient from "./ProviderBookingsClient";
import { getProviderBookings, getProviderBookingStats } from "@/lib/bookings/provider";

// Revalidate every minute - bookings change frequently
export const revalidate = 60;

export default async function ProviderBookingsPage() {
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

  // Date range (default: next 7 days)
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + 7);

  // Parallelize bookings and stats fetching
  const [bookings, stats] = await Promise.all([
    getProviderBookings(providerId, { from, to }),
    getProviderBookingStats(providerId, from, to),
  ]);

  return (
    <ProviderBookingsClient
      initialBookings={bookings}
      initialStats={stats}
      providerId={providerId}
    />
  );
}


