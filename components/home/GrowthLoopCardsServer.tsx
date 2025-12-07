import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { getSupabaseServer } from "@/lib/supabase.server";
import { getUserReferralCode } from "@/lib/referrals/getUserReferralCode";
import { GrowthLoopCards } from "./GrowthLoopCards";

export async function GrowthLoopCardsServer() {
  try {
    const supabase = createSupabaseServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Only show for logged-in users
    if (!user) {
      return null;
    }

    const serverSupabase = getSupabaseServer();
    if (!serverSupabase) {
      return null;
    }

    // Fetch child profiles count
    // Try both family_profiles/child_profiles and children table
    let childCount = 0;

    const { data: familyProfile } = await serverSupabase
      .from("family_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (familyProfile) {
      const { count } = await serverSupabase
        .from("child_profiles")
        .select("*", { count: "exact", head: true })
        .eq("family_id", familyProfile.id);
      childCount = count || 0;
    } else {
      // Fallback: check children table directly
      const { count } = await serverSupabase
        .from("children")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      childCount = count || 0;
    }

    // Fetch saved searches (last 3)
    const { data: savedSearches } = await serverSupabase
      .from("saved_searches")
      .select("id, query, town, filters, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    // Get user's referral code
    const userEmail = user.email;
    const referralCode = userEmail
      ? await getUserReferralCode(serverSupabase, userEmail)
      : null;

    // Count referrals sent (check both member_referrals and referrals tables)
    let referralsSent = 0;
    if (referralCode) {
      // Check member_referrals table
      const { count: memberCount } = await serverSupabase
        .from("member_referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_user_id", user.id);

      // Check referrals table (unified referrals)
      const { count: referralCount } = await serverSupabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_user_id", user.id)
        .eq("referral_type", "member");

      referralsSent = (memberCount || 0) + (referralCount || 0);
    }

    return (
      <GrowthLoopCards
        childCount={childCount}
        savedSearches={savedSearches || []}
        referralCode={referralCode}
        referralsSent={referralsSent}
      />
    );
  } catch (error) {
    console.error("[GrowthLoopCardsServer] Failed to load growth loop data:", error);
    return null;
  }
}

