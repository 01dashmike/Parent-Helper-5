/**
 * Test utilities for personalisation
 */

import { buildRecommendationsForUser } from "./recommendations";
import { getSupabaseServer } from "@/lib/supabase.server";
import { hasSupabaseServerEnv, isPersonalizationEnabled } from "@/lib/env";

/**
 * Create a test family profile
 */
export async function createTestProfile(params: {
  userId: string;
  householdName?: string;
  postcode?: string;
  childBirthdate?: string;
}) {
  if (!hasSupabaseServerEnv() || !isPersonalizationEnabled()) return null;

  const supabase = getSupabaseServer();
  if (!supabase) return null;

  try {
    // Create family profile
    const { data: familyProfile } = await supabase
      .from("family_profiles")
      .upsert({
        user_id: params.userId,
        household_name: params.householdName || "Test Family",
        postcode: params.postcode || null,
        marketing_opt_in: true,
      })
      .select()
      .single();

    if (!familyProfile) return null;

    // Create child profile if birthdate provided
    if (params.childBirthdate) {
      await supabase.from("child_profiles").insert({
        family_id: familyProfile.id,
        first_name: "Test Child",
        birthdate: params.childBirthdate,
        interests: [],
        allergies: [],
      });
    }

    // Create user preferences
    await supabase.from("user_preferences").upsert({
      user_id: params.userId,
      default_radius_km: 10,
      newsletter_frequency: "weekly",
    });

    return familyProfile;
  } catch (error) {
    console.error("[createTestProfile] Error:", error);
    return null;
  }
}

/**
 * Test recommendation building
 */
export async function testBuildRecommendations(userId: string) {
  if (!hasSupabaseServerEnv() || !isPersonalizationEnabled()) {
    console.log("[testBuildRecommendations] Personalisation not enabled");
    return [];
  }

  console.log(`[TEST] Building recommendations for user ${userId}`);
  const recommendations = await buildRecommendationsForUser(userId);
  console.log(`[TEST] Generated ${recommendations.length} recommendations`);

  // Check stored recommendations
  const supabase = getSupabaseServer();
  if (supabase) {
    const { data: stored } = await supabase
      .from("recommendations")
      .select("*, classes(*)")
      .eq("user_id", userId)
      .order("score", { ascending: false })
      .limit(5);

    console.log(`[TEST] Top 5 stored recommendations:`, stored);
  }

  return recommendations;
}

/**
 * Check if user has profile
 */
export async function hasProfile(userId: string): Promise<boolean> {
  if (!hasSupabaseServerEnv() || !isPersonalizationEnabled()) return false;

  const supabase = getSupabaseServer();
  if (!supabase) return false;

  const { data } = await supabase
    .from("family_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  return !!data;
}

