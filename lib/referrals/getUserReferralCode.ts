/**
 * Get user's referral code from their email
 * 
 * @param supabase - Supabase server client
 * @param userEmail - User's email address
 * @returns Promise<string | null> - Referral code if found, null otherwise
 */
export async function getUserReferralCode(
  supabase: ReturnType<typeof import("@/lib/supabase.server").getSupabaseServer>,
  userEmail: string
): Promise<string | null> {
  if (!supabase || !userEmail) {
    return null;
  }

  try {
    // First, find the user by email using auth.admin.getUserByEmail
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(userEmail.toLowerCase());
    
    if (authError || !authUser?.user?.id) {
      // User might not exist yet, or error occurred - return null silently
      return null;
    }

    // Get the user's referral code from referrals table
    // A user can have multiple referrals, so we get the most recent one
    const { data: referral } = await supabase
      .from("referrals")
      .select("referral_code")
      .eq("referrer_user_id", authUser.user.id)
      .eq("referral_type", "member")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return referral?.referral_code || null;
  } catch (error) {
    // Silent fail - analytics should never break the app
    console.error("[getUserReferralCode] Error fetching referral code:", error);
    return null;
  }
}

