"use server";

import { z } from "zod";
import { hasSupabaseServerEnv, isPersonalizationEnabled } from "@/lib/env";
import { getSupabaseServer } from "@/lib/supabase/server";
import { buildRecommendationsForUser } from "@/lib/personalisation/recommendations";

const createProfileSchema = z.object({
  userId: z.string().uuid(),
  householdName: z.string().min(1),
  postcode: z.string().optional(),
  marketingOptIn: z.boolean().default(false),
  child: z.object({
    firstName: z.string().optional(),
    birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    interests: z.array(z.string()).default([]),
    allergies: z.array(z.string()).default([]),
  }),
});

export async function createProfile(input: z.infer<typeof createProfileSchema>) {
  if (!hasSupabaseServerEnv() || !isPersonalizationEnabled()) {
    return { error: "Personalisation not enabled" };
  }

  try {
    const validated = createProfileSchema.parse(input);
    const supabase = getSupabaseServer();
    if (!supabase) {
      return { error: "Supabase not configured" };
    }

    // Create or update family profile
    const { data: familyProfile, error: familyError } = await supabase
      .from("family_profiles")
      .upsert(
        {
          user_id: validated.userId,
          household_name: validated.householdName,
          postcode: validated.postcode || null,
          marketing_opt_in: validated.marketingOptIn,
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (familyError) throw familyError;
    if (!familyProfile) throw new Error("Failed to create family profile");

    // Create child profile
    const { data: childProfile, error: childError } = await supabase
      .from("child_profiles")
      .insert({
        family_id: familyProfile.id,
        first_name: validated.child.firstName || null,
        birthdate: validated.child.birthdate,
        interests: validated.child.interests,
        allergies: validated.child.allergies,
      })
      .select()
      .single();

    if (childError) throw childError;

    // Create or update user preferences
    await supabase.from("user_preferences").upsert(
      {
        user_id: validated.userId,
        default_radius_km: 10,
      },
      { onConflict: "user_id" }
    );

    // Trigger recommendation build in background (don't await)
    buildRecommendationsForUser(validated.userId).catch((error: unknown) => {
      console.error("[createProfile] Failed to build recommendations:", error);
    });

    // Send welcome email in background (don't await)
    fetch("/api/onboarding/send-welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: validated.userId }),
    }).catch((error) => {
      console.error("[createProfile] Failed to send welcome email:", error);
    });

    return { ok: true, familyProfile, childProfile };
  } catch (error: unknown) {
    console.error("[createProfile] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create profile";
    return { error: errorMessage };
  }
}

