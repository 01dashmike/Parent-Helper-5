import { createClient } from "@/lib/supabase/server";
import { insertBookingPaymentSchema, type InsertBookingPayment } from "@/shared/schema";

/**
 * Create booking payment record when a booking is confirmed
 * @param bookingId - UUID from simple_bookings.id (not integer from bookings.id)
 */
export async function createBookingPayment(params: {
  bookingId: string; // UUID from simple_bookings.id
  providerId: number;
  amountCents: number;
  feeCents: number;
  netCents: number;
  currency?: string;
  stripeChargeId?: string;
  stripePaymentIntentId?: string;
}) {
  const supabase = createClient();
  
  // Validate and type-check the payment data
  const paymentData: InsertBookingPayment = insertBookingPaymentSchema.parse({
    booking_id: params.bookingId, // UUID from simple_bookings
    provider_id: params.providerId,
    amount_cents: params.amountCents,
    fee_cents: params.feeCents,
    net_cents: params.netCents,
    currency: params.currency || "gbp",
    stripe_charge_id: params.stripeChargeId || null,
    stripe_payment_intent_id: params.stripePaymentIntentId || null,
  });
  
  const { error } = await supabase.from("booking_payments").insert(paymentData);

  if (error) {
    console.error("[booking-payments] Failed to create payment record:", error);
    throw error;
  }

  return { success: true };
}

/**
 * Calculate platform fee (default 7%)
 */
export function calculatePlatformFee(amountCents: number, feePercent: number = 7): number {
  return Math.floor((amountCents * feePercent) / 100);
}

/**
 * Calculate net amount after fees
 */
export function calculateNetAmount(amountCents: number, feeCents: number): number {
  return amountCents - feeCents;
}

