/**
 * Wellness Authentication Utilities
 * 
 * Utilities for wellness user authentication and profile management
 */

"use server";

import { createSupabaseServerComponentClient, createSupabaseServerActionClient } from "@/lib/supabase";

/**
 * Get the current wellness user
 */
export async function getWellnessUser() {
  try {
    const supabase = createSupabaseServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    // Get wellness user record
    const { data: wellnessUser, error } = await supabase
      .from("wellness_users")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = not found
      console.error("[getWellnessUser] Error:", error);
      return null;
    }

    return wellnessUser;
  } catch (error) {
    console.error("[getWellnessUser] Error:", error);
    return null;
  }
}

/**
 * Create or update wellness user record
 */
export async function upsertWellnessUser(data: {
  email: string;
  newsletterSubscribed?: boolean;
  accountabilityEmailsEnabled?: boolean;
  accountabilityFrequency?: "weekly" | "biweekly" | "monthly";
}) {
  try {
    const supabase = createSupabaseServerActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("wellness_users")
      .upsert({
        user_id: user.id,
        email: data.email,
        newsletter_subscribed: data.newsletterSubscribed ?? false,
        accountability_emails_enabled: data.accountabilityEmailsEnabled ?? false,
        accountability_frequency: data.accountabilityFrequency,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

    if (error) {
      console.error("[upsertWellnessUser] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[upsertWellnessUser] Error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to save user data" 
    };
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const supabase = createSupabaseServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

/**
 * Get current user's email
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  try {
    const supabase = createSupabaseServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email ?? null;
  } catch {
    return null;
  }
}
