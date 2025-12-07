"use server";

import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase.server";
import { normalizeReferralCode } from "./normalizeCode";

type ClaimResult =
  | { success: true; referralId: string; referrerUserId: string }
  | { success: false; reason: string };

/**
 * Server action to claim referral if eligible
 * 
 * Checks for referral cookie and creates referral relationship
 * if user is eligible (new user, valid code, not self-referral)
 * 
 * @param userId - User ID of the person being referred
 * @param userEmail - Email of the person being referred
 * @param context - Context where referral is being claimed (e.g., "signup", "booking")
 * @returns ClaimResult with success status and referral details
 */
export async function claimReferralIfEligible(
  userId: string,
  userEmail: string,
  context: "signup" | "booking" = "signup"
): Promise<ClaimResult> {
  try {
    if (!userId || !userEmail) {
      return {
        success: false,
        reason: "Missing user information",
      };
    }

    // Get referral code from cookie
    const cookieStore = await cookies();
    const referralCookie = cookieStore.get("referral_code");

    if (!referralCookie?.value) {
      return {
        success: false,
        reason: "No referral cookie found",
      };
    }

    // Normalize referral code
    const normalizedCode = normalizeReferralCode(referralCookie.value);
    if (!normalizedCode) {
      // Invalid code format - delete cookie
      cookieStore.delete("referral_code");
      return {
        success: false,
        reason: "Invalid referral code format",
      };
    }

    const supabase = getSupabaseServer();
    if (!supabase) {
      return {
        success: false,
        reason: "Database connection error",
      };
    }

    // Find referral code in database
    // Check member_referrals table first
    const { data: memberReferral } = await supabase
      .from("member_referrals")
      .select("id, referrer_user_id, status, created_at")
      .eq("referral_code", normalizedCode)
      .maybeSingle();

    // Check referrals table (unified referrals)
    const { data: referral } = await supabase
      .from("referrals")
      .select("id, referrer_user_id, referral_type, created_at")
      .eq("referral_code", normalizedCode)
      .maybeSingle();

    const foundReferral = memberReferral || referral;
    if (!foundReferral) {
      // Invalid referral code - delete cookie
      cookieStore.delete("referral_code");
      return {
        success: false,
        reason: "Referral code not found",
      };
    }

    const referrerUserId = foundReferral.referrer_user_id;

    // Check if self-referral
    if (referrerUserId === userId) {
      cookieStore.delete("referral_code");
      return {
        success: false,
        reason: "Cannot refer yourself",
      };
    }

    // Check if referral already exists for this user
    const { data: existingReferral } = await supabase
      .from("member_referrals")
      .select("id")
      .eq("referrer_user_id", referrerUserId)
      .eq("referred_user_id", userId)
      .maybeSingle();

    if (existingReferral) {
      // Referral already claimed - don't delete cookie, just return existing
      return {
        success: true,
        referralId: existingReferral.id,
        referrerUserId,
      };
    }

    // Check if referral exists by email (for signup context)
    if (context === "signup") {
      const { data: existingByEmail } = await supabase
        .from("member_referrals")
        .select("id")
        .eq("referrer_user_id", referrerUserId)
        .eq("referred_email", userEmail.toLowerCase())
        .maybeSingle();

      if (existingByEmail) {
        // Update existing referral with user_id
        const { data: updated } = await supabase
          .from("member_referrals")
          .update({
            referred_user_id: userId,
            status: "converted",
            converted_at: new Date().toISOString(),
          })
          .eq("id", existingByEmail.id)
          .select("id")
          .single();

        if (updated) {
          // Clear cookie after successful claim
          cookieStore.delete("referral_code");
          return {
            success: true,
            referralId: updated.id,
            referrerUserId,
          };
        }
      }
    }

    // Create new referral relationship
    const { data: newReferral, error } = await supabase
      .from("member_referrals")
      .insert({
        referrer_user_id: referrerUserId,
        referred_user_id: userId,
        referred_email: userEmail.toLowerCase(),
        referral_code: normalizedCode,
        status: context === "signup" ? "converted" : "pending",
        converted_at: context === "signup" ? new Date().toISOString() : null,
        metadata: {
          claimed_at: new Date().toISOString(),
          claimed_context: context,
        },
      })
      .select("id")
      .single();

    if (error || !newReferral) {
      console.error("[claimReferralIfEligible] Error creating referral:", error);
      return {
        success: false,
        reason: "Failed to create referral relationship",
      };
    }

    // Clear cookie after successful claim
    cookieStore.delete("referral_code");

    return {
      success: true,
      referralId: newReferral.id,
      referrerUserId,
    };
  } catch (error) {
    console.error("[claimReferralIfEligible] Error:", error);
    return {
      success: false,
      reason: "Unexpected error",
    };
  }
}

