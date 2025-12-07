/**
 * Stripe Payment Integration for Bookings
 * 
 * Handles payment intent creation and confirmation for bookings
 */

import { stripe } from "@/lib/stripe/client";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Create payment intent for a booking
 */
export async function createBookingPaymentIntent(params: {
  bookingId: number;
  amountCents: number;
  currency?: string;
  providerId: number;
}): Promise<{ success: boolean; clientSecret?: string; paymentIntentId?: string; error?: string }> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  try {
    // Check if provider has Stripe account
    const { data: stripeAccount } = await supabase
      .from("provider_stripe_accounts")
      .select("stripe_account_id, is_active")
      .eq("provider_id", params.providerId)
      .eq("is_active", true)
      .single();

    // For now, use platform account (Stripe Connect would use stripe_account_id)

    // Get booking details
    const { data: booking } = await supabase
      .from("bookings")
      .select("parent_email, parent_first_name, parent_last_name")
      .eq("id", params.bookingId)
      .single();

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amountCents,
      currency: params.currency || "gbp",
      metadata: {
        booking_id: params.bookingId.toString(),
        provider_id: params.providerId.toString(),
      },
      receipt_email: booking.parent_email,
      description: `Booking #${params.bookingId}`,
      // For Stripe Connect, add:
      // application_fee_amount: calculateFee(params.amountCents),
      // transfer_data: { destination: stripeAccount?.stripe_account_id },
    });

    // Create payment record
    await supabase.from("booking_payments").insert({
      booking_id: params.bookingId,
      stripe_payment_intent_id: paymentIntent.id,
      amount_cents: params.amountCents,
      currency: params.currency || "gbp",
      status: "pending",
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret || undefined,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error("[createBookingPaymentIntent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create payment intent",
    };
  }
}

/**
 * Confirm payment and mark booking as paid
 */
export async function confirmBookingPayment(params: {
  paymentIntentId: string;
}): Promise<{ success: boolean; bookingId?: number; error?: string }> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  try {
    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(params.paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return { success: false, error: `Payment not succeeded. Status: ${paymentIntent.status}` };
    }

    // Get booking ID from metadata
    const bookingId = parseInt(paymentIntent.metadata.booking_id || "0", 10);
    if (!bookingId) {
      return { success: false, error: "Booking ID not found in payment intent" };
    }

    // Update payment record
    await supabase
      .from("booking_payments")
      .update({
        status: "succeeded",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_payment_intent_id", params.paymentIntentId);

    // Update booking status
    await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    return { success: true, bookingId };
  } catch (error) {
    console.error("[confirmBookingPayment] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to confirm payment",
    };
  }
}

/**
 * Stub payment (for development/testing)
 */
export async function stubBookingPayment(params: {
  bookingId: number;
  amountCents: number;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  try {
    // Create payment record (marked as succeeded)
    await supabase.from("booking_payments").insert({
      booking_id: params.bookingId,
      amount_cents: params.amountCents,
      currency: "gbp",
      status: "succeeded",
      metadata: { stub: true },
    });

    // Update booking status
    await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.bookingId);

    return { success: true };
  } catch (error) {
    console.error("[stubBookingPayment] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process stub payment",
    };
  }
}

