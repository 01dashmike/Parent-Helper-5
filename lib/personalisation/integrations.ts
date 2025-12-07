/**
 * Integration hooks for personalisation
 * Call these from sign-in flows, profile updates, etc.
 */

import { buildRecommendationsForUser } from "./recommendations";
import { isPersonalizationEnabled, isAutoRecsOnSigninEnabled } from "@/lib/env";
import { getSupabaseServer } from "@/lib/supabase.server";

/**
 * Call this after user signs in (if AUTO_RECS_ON_SIGNIN enabled)
 */
export async function onUserSignin(userId: string) {
  if (!isPersonalizationEnabled() || !isAutoRecsOnSigninEnabled()) return;

  try {
    // Check if user has a profile
    const supabase = getSupabaseServer();
    if (!supabase) return;

    const { data: profile } = await supabase
      .from("family_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (profile) {
      // User has profile, build recommendations in background
      buildRecommendationsForUser(userId).catch((error) => {
        console.error("[onUserSignin] Failed to build recommendations:", error);
      });
    }
  } catch (error) {
    console.error("[onUserSignin] Error:", error);
  }
}

/**
 * Call this when user updates their profile
 */
export async function onProfileUpdate(userId: string) {
  if (!isPersonalizationEnabled()) return;

  try {
    // Rebuild recommendations in background
    buildRecommendationsForUser(userId).catch((error) => {
      console.error("[onProfileUpdate] Failed to rebuild recommendations:", error);
    });
  } catch (error) {
    console.error("[onProfileUpdate] Error:", error);
  }
}

/**
 * Call this when user creates or updates a saved search
 */
export async function onSavedSearchChange(userId: string) {
  if (!isPersonalizationEnabled()) return;

  try {
    // Optionally rebuild recommendations to include search preferences
    buildRecommendationsForUser(userId).catch((error) => {
      console.error("[onSavedSearchChange] Failed to rebuild recommendations:", error);
    });
  } catch (error) {
    console.error("[onSavedSearchChange] Error:", error);
  }
}

