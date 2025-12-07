import { redirect, notFound } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import ProviderBookingDetailClient from "./ProviderBookingDetailClient";
import { getProviderBooking } from "@/lib/bookings/provider";

type BookingDetailPageProps = {
  params: Promise<{ bookingId: string }>;
};

export default async function ProviderBookingDetailPage({ params }: BookingDetailPageProps) {
  const { bookingId } = await params;
  const bookingIdNum = parseInt(bookingId, 10);

  if (isNaN(bookingIdNum)) {
    notFound();
  }

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

  const booking = await getProviderBooking(providerUser.provider_id, bookingIdNum);

  if (!booking) {
    notFound();
  }

  return <ProviderBookingDetailClient booking={booking} providerId={providerUser.provider_id} />;
}

