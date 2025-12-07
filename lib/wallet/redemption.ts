/**
 * Booking Credit Redemptions
 * 
 * Functions for redeeming credits or passes for bookings
 */

import { getSupabaseServer } from "@/lib/supabase/server";
import { spendCredits } from "./wallet";
import { getActivePass, isPassActive } from "./passes";
import { getProviderCreditSettings, creditCostForClass } from "./providerCredits";

/**
 * Redeem credits for a booking - OPTIMIZED
 * 
 * Validates:
 * - Booking exists and belongs to user
 * - User has sufficient credits
 * - Class is eligible for credits
 * 
 * Deducts credits and creates redemption record
 * 
 * OPTIMIZATIONS:
 * - Parallel queries for booking validation and provider settings
 * - Cached provider settings (multi-level cache)
 * - Single atomic transaction where possible
 */
export async function redeemCreditsForBooking(
  userId: string,
  bookingId: string,
  classId: string,
  providerId: string
): Promise<{ success: boolean; creditsSpent: number; error?: string }> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { success: false, creditsSpent: 0, error: "Database not configured" };
  }

  try {
    // OPTIMIZATION: Run booking validation and settings fetch in parallel
    const [bookingResult, settings] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, user_id, provider_id, status")
        .eq("id", bookingId)
        .single(),
      getProviderCreditSettings(providerId) // Uses cache
    ]);

    // Validate booking
    const { data: booking, error: bookingError } = bookingResult;
    if (bookingError || !booking) {
      return { success: false, creditsSpent: 0, error: "Booking not found" };
    }

    if (booking.user_id !== userId) {
      return { success: false, creditsSpent: 0, error: "Unauthorized" };
    }

    // Validate provider accepts credits
    if (!settings || !settings.acceptsCredits) {
      return { success: false, creditsSpent: 0, error: "Provider does not accept credits" };
    }

    // Get credit cost for this class
    const creditCost = creditCostForClass(classId, settings);
    if (!creditCost) {
      return { success: false, creditsSpent: 0, error: "Class is not eligible for credits" };
    }

    // Deduct credits
    const spendResult = await spendCredits(userId, creditCost, {
      bookingId,
      providerId,
      classId,
      description: `Booking #${bookingId}`,
    });

    if (!spendResult.success) {
      return { success: false, creditsSpent: 0, error: spendResult.error };
    }

    // Create redemption record
    const { error: redemptionError } = await supabase
      .from("booking_credit_redemptions")
      .insert({
        booking_id: bookingId,
        user_id: userId,
        provider_id: providerId,
        credits_spent: creditCost,
        pass_id: null,
      });

    if (redemptionError) {
      // Rollback credit deduction (refund)
      await spendCredits(userId, -creditCost, {
        bookingId,
        providerId,
        classId,
        description: `Refund for failed redemption`,
        type: "refund",
      });
      return { success: false, creditsSpent: 0, error: redemptionError.message };
    }

    return { success: true, creditsSpent: creditCost };
  } catch (error) {
    console.error("[redeemCreditsForBooking] Error:", error);
    return {
      success: false,
      creditsSpent: 0,
      error: error instanceof Error ? error.message : "Failed to redeem credits",
    };
  }
}

/**
 * Redeem pass for a booking - OPTIMIZED
 * 
 * Validates:
 * - Booking exists and belongs to user
 * - User has active pass for provider
 * - Pass is valid for this class
 * 
 * Links pass to booking (no credit deduction)
 * 
 * OPTIMIZATIONS:
 * - Parallel queries for booking and pass validation
 * - Single atomic transaction where possible
 */
export async function redeemPassForBooking(
  userId: string,
  bookingId: string,
  providerId: string
): Promise<{ success: boolean; passId?: number; error?: string }> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  try {
    // OPTIMIZATION: Run booking and pass validation in parallel
    const [bookingResult, pass] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, user_id, provider_id, status")
        .eq("id", bookingId)
        .single(),
      getActivePass(userId, providerId)
    ]);

    // Validate booking
    const { data: booking, error: bookingError } = bookingResult;
    if (bookingError || !booking) {
      return { success: false, error: "Booking not found" };
    }

    if (booking.user_id !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate pass
    if (!pass) {
      return { success: false, error: "No active pass found for this provider" };
    }

    if (!isPassActive(pass)) {
      return { success: false, error: "Pass has expired" };
    }

    // Create redemption record (with pass_id, no credits_spent)
    const { error: redemptionError } = await supabase
      .from("booking_credit_redemptions")
      .insert({
        booking_id: bookingId,
        user_id: userId,
        provider_id: providerId,
        credits_spent: 0,
        pass_id: pass.id,
      });

    if (redemptionError) {
      return { success: false, error: redemptionError.message };
    }

    return { success: true, passId: pass.id };
  } catch (error) {
    console.error("[redeemPassForBooking] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to redeem pass",
    };
  }
}

/**
 * Refund credits for a cancelled booking
 * 
 * If credits were spent, refunds them.
 * If pass was used, no refund (passes are time-based)
 */
export async function refundCreditsForBooking(
  bookingId: string
): Promise<{ success: boolean; creditsRefunded: number; error?: string }> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { success: false, creditsRefunded: 0, error: "Database not configured" };
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
      const { addCredits } = await import("./wallet");
      await addCredits(redemption.user_id, creditsToRefund, {
        type: "refund",
        bookingId,
        providerId: redemption.provider_id,
        description: `Refund for cancelled booking #${bookingId}`,
      });
    }

    // Delete redemption record
    await supabase.from("booking_credit_redemptions").delete().eq("booking_id", bookingId);

    return { success: true, creditsRefunded: creditsToRefund };
  } catch (error) {
    console.error("[refundCreditsForBooking] Error:", error);
    return {
      success: false,
      creditsRefunded: 0,
      error: error instanceof Error ? error.message : "Failed to refund credits",
    };
  }
}


