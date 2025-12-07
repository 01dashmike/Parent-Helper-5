/**
 * Payment reconciliation helper functions
 * Centralized logic for calculating booking revenue, Stripe charges, and provider payouts
 */

import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export type BookingRow = {
  id: string | number;
  amount_cents?: number | null;
  total_paid?: string | number | null;
  stripe_charge_id?: string | null;
  stripe_payment_intent_id?: string | null;
  stripe_checkout_id?: string | null;
  status?: string | null;
  payment_status?: string | null;
  provider_id?: number | null;
  metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
};

export type StripeChargeData = {
  id: string;
  amount: number; // in cents
  amount_refunded: number; // in cents
  currency: string;
  status: string;
  paid: boolean;
  refunded: boolean;
  payment_intent?: string;
  discount?: {
    coupon?: {
      id: string;
      name?: string;
      percent_off?: number;
      amount_off?: number;
    };
  };
  metadata?: Record<string, string>;
};

export type ProviderPayoutStatus = {
  processed: boolean;
  payoutId?: string | null;
  payoutDate?: string | null;
  payoutAmount?: number | null;
  status?: "pending" | "paid" | "failed" | null;
};

export type BookingRevenue = {
  grossAmountCents: number;
  discountCents: number;
  netAmountCents: number;
  refundAmountCents: number;
  finalAmountCents: number;
  feeCents: number;
  providerNetCents: number;
  hasCoupon: boolean;
  couponId?: string | null;
  couponName?: string | null;
  isRefunded: boolean;
  isPartialRefund: boolean;
  isZeroCost: boolean;
  paymentMethod: "stripe" | "wallet" | "unknown";
};

/**
 * Get Stripe charge data for a booking
 * Handles both charge_id and payment_intent_id lookups
 */
export async function getStripeChargeForBooking(
  bookingId: string | number,
  bookingRow?: BookingRow
): Promise<StripeChargeData | null> {
  try {
    const stripe = getStripe();
    if (!stripe) {
      console.warn("[reconciliation] Stripe not configured");
      return null;
    }

    // Get booking data if not provided
    let booking: BookingRow | null = bookingRow || null;
    if (!booking) {
      const supabase = createClient();
      
      // Try simple_bookings first (UUID)
      if (typeof bookingId === "string") {
        const { data: simpleBooking } = await supabase
          .from("simple_bookings")
          .select("stripe_checkout_id, stripe_payment_link_url")
          .eq("id", bookingId)
          .single();
        
        if (simpleBooking) {
          booking = {
            id: bookingId,
            stripe_payment_intent_id: simpleBooking.stripe_checkout_id,
            stripe_checkout_id: simpleBooking.stripe_checkout_id,
          };
        }
      }
      
      // Try booking_payments for charge ID
      const { data: payment } = await supabase
        .from("booking_payments")
        .select("stripe_charge_id, stripe_payment_intent_id")
        .eq("booking_id", bookingId)
        .maybeSingle();
      
      if (payment) {
        booking = {
          id: bookingId,
          stripe_charge_id: payment.stripe_charge_id,
          stripe_payment_intent_id: payment.stripe_payment_intent_id,
        };
      }
    }

    if (!booking) {
      return null;
    }

    // Try to get charge by charge_id first
    if (booking.stripe_charge_id) {
      try {
        const charge = await stripe.charges.retrieve(booking.stripe_charge_id, {
          expand: ['discount', 'discount.coupon']
        });
        const chargeData = charge as Stripe.Charge & { discount?: Stripe.Discount | null };
        return {
          id: charge.id,
          amount: charge.amount,
          amount_refunded: charge.amount_refunded || 0,
          currency: charge.currency,
          status: charge.status,
          paid: charge.paid,
          refunded: charge.refunded,
          payment_intent: typeof charge.payment_intent === "string" ? charge.payment_intent : undefined,
          discount: chargeData.discount ? {
            coupon: chargeData.discount.coupon ? {
              id: chargeData.discount.coupon.id,
              name: typeof chargeData.discount.coupon === "object" && "name" in chargeData.discount.coupon ? chargeData.discount.coupon.name || undefined : undefined,
              percent_off: typeof chargeData.discount.coupon === "object" && "percent_off" in chargeData.discount.coupon ? chargeData.discount.coupon.percent_off || undefined : undefined,
              amount_off: typeof chargeData.discount.coupon === "object" && "amount_off" in chargeData.discount.coupon ? chargeData.discount.coupon.amount_off || undefined : undefined,
            } : undefined,
          } : undefined,
          metadata: charge.metadata || {},
        };
      } catch (error) {
        console.warn(`[reconciliation] Failed to retrieve charge ${booking.stripe_charge_id}:`, error);
      }
    }

    // Fallback: try payment_intent_id
    const paymentIntentId = booking.stripe_payment_intent_id || booking.stripe_checkout_id;
    if (paymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
          expand: ['charges']
        });
        
        // Get the charge from payment intent
        const paymentIntentData = paymentIntent as unknown as Stripe.PaymentIntent & { charges?: { data?: Stripe.Charge[] } };
        if (paymentIntentData.charges?.data && paymentIntentData.charges.data.length > 0) {
          const charge = paymentIntentData.charges.data[0] as Stripe.Charge & { discount?: Stripe.Discount | null };
          return {
            id: charge.id,
            amount: charge.amount,
            amount_refunded: charge.amount_refunded || 0,
            currency: charge.currency,
            status: charge.status,
            paid: charge.paid,
            refunded: charge.refunded,
            payment_intent: paymentIntent.id,
            discount: charge.discount ? {
              coupon: charge.discount.coupon ? {
                id: typeof charge.discount.coupon === "string" ? charge.discount.coupon : charge.discount.coupon.id,
                name: typeof charge.discount.coupon === "object" && "name" in charge.discount.coupon ? charge.discount.coupon.name || undefined : undefined,
                percent_off: typeof charge.discount.coupon === "object" && "percent_off" in charge.discount.coupon ? charge.discount.coupon.percent_off || undefined : undefined,
                amount_off: typeof charge.discount.coupon === "object" && "amount_off" in charge.discount.coupon ? charge.discount.coupon.amount_off || undefined : undefined,
              } : undefined,
            } : undefined,
            metadata: charge.metadata || {},
          };
        }
      } catch (error) {
        console.warn(`[reconciliation] Failed to retrieve payment intent ${paymentIntentId}:`, error);
      }
    }

    return null;
  } catch (error) {
    console.error("[reconciliation] Error getting Stripe charge:", error);
    return null;
  }
}

/**
 * Get provider payout status for a booking
 * Checks if payout has been processed and when
 */
export async function getProviderPayoutStatus(
  bookingId: string | number,
  providerId?: number | null
): Promise<ProviderPayoutStatus> {
  try {
    const supabase = createClient();
    
    // Get provider_id from booking if not provided
    let actualProviderId = providerId;
    if (!actualProviderId) {
      if (typeof bookingId === "string") {
        // UUID - check simple_bookings
        const { data: booking } = await supabase
          .from("simple_bookings")
          .select("occurrence_id")
          .eq("id", bookingId)
          .single();
        
        if (booking?.occurrence_id) {
          const { data: occurrence } = await supabase
            .from("session_instances")
            .select("class_sessions!inner(classes!inner(provider_id))")
            .eq("id", booking.occurrence_id)
            .single();
          
          type OccurrenceRow = { class_sessions?: { classes?: { provider_id?: number | null } | null } | null } | null;
          const occurrenceRow = occurrence as OccurrenceRow;
          actualProviderId = occurrenceRow?.class_sessions?.classes?.provider_id || undefined;
        }
      }
      
      // Also check booking_payments
      const { data: payment } = await supabase
        .from("booking_payments")
        .select("provider_id")
        .eq("booking_id", bookingId)
        .maybeSingle();
      
      if (payment?.provider_id) {
        actualProviderId = payment.provider_id;
      }
    }

    if (!actualProviderId) {
      return { processed: false };
    }

    // Check for payout records
    // Check stripe_payouts_cache for provider payouts
    const { data: payouts } = await supabase
      .from("stripe_payouts_cache")
      .select("payout_id, amount, status, arrival_date, provider_id")
      .eq("provider_id", actualProviderId)
      .order("arrival_date", { ascending: false })
      .limit(10);

    // Check if booking payment is included in any payout
    // This is a simplified check - in reality, you'd need to track which bookings
    // are included in which payout via a junction table
    const { data: bookingPayment } = await supabase
      .from("booking_payments")
      .select("id, created_at, net_cents")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (bookingPayment && payouts && payouts.length > 0) {
      // Check if payout date is after booking payment date
      const bookingDate = new Date(bookingPayment.created_at);
      const relevantPayout = payouts.find((p: { arrival_date?: string | null; status?: string }) => {
        if (!p.arrival_date) return false;
        const payoutDate = new Date(p.arrival_date);
        return payoutDate >= bookingDate && (p.status === "paid" || p.status === "pending");
      });

      if (relevantPayout) {
        return {
          processed: relevantPayout.status === "paid",
          payoutId: relevantPayout.payout_id || null,
          payoutDate: relevantPayout.arrival_date || null,
          payoutAmount: relevantPayout.amount || null,
          status: relevantPayout.status as "pending" | "paid" | "failed" | null,
        };
      }
    }

    return { processed: false };
  } catch (error) {
    console.error("[reconciliation] Error getting payout status:", error);
    return { processed: false };
  }
}

/**
 * Compute booking revenue with all edge cases
 * Handles discounts, coupons, zero-fee bookings, refunds
 */
export async function computeBookingRevenue(
  bookingRow: BookingRow
): Promise<BookingRevenue> {
  // Get base amount from booking
  let grossAmountCents = 0;
  
  if (bookingRow.amount_cents !== null && bookingRow.amount_cents !== undefined) {
    grossAmountCents = bookingRow.amount_cents;
  } else if (bookingRow.total_paid !== null && bookingRow.total_paid !== undefined) {
    const totalPaid = typeof bookingRow.total_paid === "string" 
      ? parseFloat(bookingRow.total_paid) 
      : bookingRow.total_paid;
    grossAmountCents = Math.round(totalPaid * 100);
  }

  // Check if this is a wallet payment (no Stripe charge)
  const isWalletPayment = bookingRow.metadata?.payment_method === "wallet" || 
                          (!bookingRow.stripe_charge_id && 
                           !bookingRow.stripe_payment_intent_id && 
                           !bookingRow.stripe_checkout_id &&
                           bookingRow.status === "confirmed");

  // Check if booking is refunded (for wallet payments, check metadata or status)
  const isRefundedBooking = bookingRow.status === "cancelled" || 
                            bookingRow.status === "refunded" ||
                            bookingRow.payment_status === "refunded" ||
                            (isWalletPayment && bookingRow.metadata?.refunded === true);

  // Get Stripe charge data for accurate amounts (skip for wallet payments)
  const stripeCharge = isWalletPayment ? null : await getStripeChargeForBooking(bookingRow.id, bookingRow);
  
  let discountCents = 0;
  let refundAmountCents = 0;
  let hasCoupon = false;
  let couponId: string | null = null;
  let couponName: string | null = null;

  if (stripeCharge) {
    // Use Stripe charge amount as source of truth
    grossAmountCents = stripeCharge.amount;
    refundAmountCents = stripeCharge.amount_refunded || 0;

    // Handle discounts/coupons
    if (stripeCharge.discount?.coupon) {
      hasCoupon = true;
      couponId = stripeCharge.discount.coupon.id;
      couponName = stripeCharge.discount.coupon.name || null;

      if (stripeCharge.discount.coupon.percent_off) {
        // Percentage discount
        discountCents = Math.round(
          (grossAmountCents * stripeCharge.discount.coupon.percent_off) / 100
        );
      } else if (stripeCharge.discount.coupon.amount_off) {
        // Fixed amount discount
        discountCents = stripeCharge.discount.coupon.amount_off;
      }
    }
  }

  // Calculate net amount after discount
  const netAmountCents = Math.max(0, grossAmountCents - discountCents);

  // Calculate final amount after refunds
  // For refunded wallet bookings, set revenue to 0
  let finalAmountCents = Math.max(0, netAmountCents - refundAmountCents);
  
  if (isRefundedBooking && isWalletPayment) {
    // Wallet booking refunded - revenue is 0
    finalAmountCents = 0;
    refundAmountCents = netAmountCents; // Mark as fully refunded
  }

  // Check for zero-cost booking
  const isZeroCost = finalAmountCents === 0 && grossAmountCents === 0;

  // Calculate platform fee (default 7%)
  // Zero-cost bookings have no fee
  const feePercent = isZeroCost ? 0 : 7;
  const feeCents = isZeroCost ? 0 : Math.floor((finalAmountCents * feePercent) / 100);

  // Calculate provider net (after platform fee)
  const providerNetCents = Math.max(0, finalAmountCents - feeCents);

  // Check refund status
  const isRefunded = refundAmountCents > 0 && refundAmountCents >= netAmountCents;
  const isPartialRefund = refundAmountCents > 0 && refundAmountCents < netAmountCents;

  // Determine payment method
  const paymentMethod: "stripe" | "wallet" | "unknown" = isWalletPayment 
    ? "wallet" 
    : stripeCharge 
      ? "stripe" 
      : "unknown";

  return {
    grossAmountCents,
    discountCents,
    netAmountCents,
    refundAmountCents,
    finalAmountCents,
    feeCents,
    providerNetCents,
    hasCoupon,
    couponId,
    couponName,
    isRefunded,
    isPartialRefund,
    isZeroCost,
    paymentMethod,
  };
}

