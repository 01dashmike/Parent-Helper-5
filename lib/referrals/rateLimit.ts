import { getSupabaseServer } from "@/lib/supabase.server";

/**
 * Maximum number of referral invitations a user can send per day
 */
export const MAX_REFERRALS_PER_DAY = 10;

/**
 * Result of checking rate limit
 */
export type RateLimitResult =
  | { allowed: true; count: number; remaining: number }
  | { allowed: false; count: number; error: string };

/**
 * Check if a user can create a new referral based on daily rate limit
 * 
 * @param userId - The user ID to check rate limit for
 * @returns Rate limit check result with count and remaining referrals
 */
export async function checkReferralRateLimit(
  userId: string
): Promise<RateLimitResult> {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return {
        allowed: false,
        count: 0,
        error: "Server configuration error",
      };
    }

    // Calculate timestamp for 24 hours ago
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Count referrals created by this user in the last 24 hours
    const { count, error } = await supabase
      .from("member_referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_user_id", userId)
      .gte("created_at", twentyFourHoursAgo.toISOString());

    if (error) {
      console.error("Error checking referral rate limit:", error);
      return {
        allowed: false,
        count: 0,
        error: "Failed to check rate limit",
      };
    }

    const referralCount = count ?? 0;
    const remaining = Math.max(0, MAX_REFERRALS_PER_DAY - referralCount);

    if (referralCount >= MAX_REFERRALS_PER_DAY) {
      return {
        allowed: false,
        count: referralCount,
        error: "Daily referral limit reached.",
      };
    }

    return {
      allowed: true,
      count: referralCount,
      remaining,
    };
  } catch (error: unknown) {
    console.error("Error in checkReferralRateLimit:", error);
    return {
      allowed: false,
      count: 0,
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
}

