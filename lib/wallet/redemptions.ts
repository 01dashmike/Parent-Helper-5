/**
 * Booking Credit Redemptions
 * 
 * Functions for linking credits/passes to bookings
 */

import { getSupabaseServer } from "@/lib/supabase/server";
import { spendCredits } from "./core";
import { isPassActive } from "./passes";

/**
 * Redeem credits for a booking
 */
export async function redeemCreditsForBooking(
  userId: string,
  bookingId: number,
  creditsSpent: number,
  passId?: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  try {
    // Create redemption record
    const { error: redemptionError } = await supabase
      .from("booking_credit_redemptions")
      .insert({
        booking_id: bookingId,
        user_id: userId,
        credits_spent: creditsSpent,
        pass_id: passId || null,
      });

    if (redemptionError) {
      console.error("[redeemCreditsForBooking] Error:", redemptionError);
      return { success: false, error: redemptionError.message };
    }

    // If credits were spent (not just pass), deduct from wallet
    if (creditsSpent > 0 && !passId) {
      const spendResult = await spendCredits(userId, creditsSpent, {
        bookingId,
        description: `Booking #${bookingId}`,
      });

      if (!spendResult.success) {
        // Rollback redemption record
        await supabase.from("booking_credit_redemptions").delete().eq("booking_id", bookingId);
        return spendResult;
      }
    }

    return { success: true };
  } catch (error) {
    console.error("[redeemCreditsForBooking] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to redeem credits",
    };
  }
}

/**
 * Refund credits for a cancelled booking
 */
export async function refundCreditsForBooking(
  bookingId: number
): Promise<{ success: boolean; creditsRefunded?: number; error?: string }> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  try {
    // Get redemption record
    const { data: redemption, error: redemptionError } = await supabase
      .from("booking_credit_redemptions")
      .select("*")
      .eq("booking_id", bookingId)
      .single();

    if (redemptionError || !redemption) {
      // No redemption found, nothing to refund
      return { success: true, creditsRefunded: 0 };
    }

    // If pass was used, don't refund (passes are time-based)
    if (redemption.pass_id) {
      return { success: true, creditsRefunded: 0 };
    }

    // Refund credits
    const creditsToRefund = redemption.credits_spent;
    if (creditsToRefund > 0) {
      const { addCredits } = await import("./core");
      const refundResult = await addCredits(redemption.user_id, creditsToRefund, {
        type: "refund",
        bookingId,
        description: `Refund for cancelled booking #${bookingId}`,
      });

      if (!refundResult.success) {
        return refundResult;
      }
    }

    // Delete redemption record (or mark as refunded in metadata)
    await supabase.from("booking_credit_redemptions").delete().eq("booking_id", bookingId);

    return { success: true, creditsRefunded: creditsToRefund };
  } catch (error) {
    console.error("[refundCreditsForBooking] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to refund credits",
    };
  }
}

/**
 * Get redemption info for a booking
 */
export async function getBookingRedemption(bookingId: number): Promise<{
  creditsSpent: number;
  passId?: number;
  userId?: string;
} | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data: redemption, error } = await supabase
    .from("booking_credit_redemptions")
    .select("*")
    .eq("booking_id", bookingId)
    .single();

  if (error || !redemption) {
    return null;
  }

  return {
    creditsSpent: redemption.credits_spent,
    passId: redemption.pass_id || undefined,
    userId: redemption.user_id,
  };
}





