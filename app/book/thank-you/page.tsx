import { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase.server";
import ThankYouClient from "@/components/book/ThankYouClient";
import { WalletThankYouClient } from "@/components/book/WalletThankYouClient";

export const metadata: Metadata = {
  title: "Booking Confirmed | Parent Helper",
  description: "Your booking has been confirmed",
};

export const dynamic = "force-dynamic";

async function getBookingDetails(sessionId: string) {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  // Find booking by Stripe checkout session ID
  // First try stripe_checkout_session_id, then fallback to stripe_payment_intent_id for backwards compatibility
  const { data: bookingRequest } = await supabase
    .from("booking_requests")
    .select("*, bookings(*)")
    .or(`stripe_checkout_session_id.eq.${sessionId},stripe_payment_intent_id.eq.${sessionId}`)
    .single();

  if (!bookingRequest) return null;

  const booking = Array.isArray(bookingRequest.bookings)
    ? bookingRequest.bookings[0]
    : bookingRequest.bookings;

  if (!booking) return null;

  // Get class details
  const { data: classData } = await supabase
    .from("classes")
    .select("name, providers(name)")
    .eq("id", bookingRequest.class_id)
    .single();

  // Get occurrence details
  const { data: occurrence } = await supabase
    .from("session_instances")
    .select("starts_at, ends_at")
    .eq("id", bookingRequest.session_instance_id)
    .single();

  return {
    booking,
    bookingRequest,
    classData,
    occurrence,
  };
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; booking_id?: string; payment_method?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;
  const bookingId = params.booking_id;
  const paymentMethod = params.payment_method;

  // Handle wallet payment (booking_id provided)
  if (bookingId && paymentMethod === "wallet") {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return (
        <div className="min-h-screen bg-cream px-4 py-20 text-center">
          <h1 className="text-title font-semibold text-charcoal">Error</h1>
          <p className="mt-4 text-slateSoft">Unable to load booking details.</p>
        </div>
      );
    }

    const { data: booking } = await supabase
      .from("simple_bookings")
      .select(`
        id,
        email,
        amount_cents,
        status,
        created_at,
        occurrence_id,
        session_instances:occurrence_id (
          id,
          starts_at,
          ends_at,
          class_sessions!inner (
            id,
            title,
            classes!inner (
              id,
              name,
              providers!inner (
                id,
                name
              )
            )
          )
        )
      `)
      .eq("id", bookingId)
      .single();

    if (!booking) {
      return (
        <div className="min-h-screen bg-cream px-4 py-20 text-center">
          <h2 className="text-title font-semibold text-charcoal">Booking Not Found</h2>
          <p className="mt-4 text-slateSoft">Unable to find your booking.</p>
        </div>
      );
    }

    const classData = (booking.session_instances as any)?.class_sessions?.classes;
    const providerData = classData?.providers;

    return (
      <div className="min-h-screen bg-cream px-4 py-20">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-sage/20 bg-white p-8 shadow-xl">
            <div className="text-center">
              <div className="mb-4 text-display-1">✅</div>
              <h1 className="text-display-2 font-semibold text-charcoal">Booking Confirmed!</h1>
              <p className="mt-2 text-slateSoft">Your booking has been successfully completed.</p>
            </div>

            <div className="mt-8 space-y-4 rounded-lg border border-sage/20 bg-cream/30 p-6">
              <div>
                <h2 className="font-semibold text-charcoal">{classData?.name || "Class"}</h2>
                {providerData?.name && (
                  <p className="text-small text-slateSoft">by {providerData.name}</p>
                )}
              </div>
              {booking.session_instances?.starts_at && (
                <WalletThankYouClient startsAt={booking.session_instances.starts_at} />
              )}
              <div>
                <p className="text-small text-slateSoft">Amount Paid</p>
                <p className="font-medium text-charcoal">
                  £{(booking.amount_cents / 100).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-small text-slateSoft">Payment Method</p>
                <p className="font-medium text-green-600">Paid with Family Wallet</p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/" className="ph-btn inline-block">
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle Stripe payment (session_id provided)
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-cream px-4 py-20 text-center">
        <h2 className="text-title font-semibold text-charcoal">Invalid Session</h2>
        <p className="mt-4 text-slateSoft">No session ID provided.</p>
      </div>
    );
  }

  const bookingDetails = await getBookingDetails(sessionId);

  return (
    <div className="min-h-screen bg-cream px-4 py-20">
      <div className="mx-auto max-w-2xl">
        <Suspense fallback={<div className="h-64 motion-safe:animate-pulse motion-reduce:animate-none rounded-2xl bg-cream/50" />}>
          <ThankYouClient bookingDetails={bookingDetails} />
        </Suspense>
      </div>
    </div>
  );
}

