/**
 * Wellness Newsletter Utilities
 * 
 * Utilities for managing newsletter subscriptions
 */

"use server";

import { createSupabaseServerActionClient } from "@/lib/supabase";

export type NewsletterResult = {
  success: boolean;
  error?: string;
};

/**
 * Subscribe a user to the newsletter
 */
export async function subscribeToNewsletter(
  email: string
): Promise<NewsletterResult> {
  try {
    const supabase = createSupabaseServerActionClient();

    // Check if newsletters table exists and add subscription
    const { error } = await supabase
      .from("newsletters")
      .upsert({
        email: email.toLowerCase().trim(),
        is_active: true,
        subscribed_at: new Date().toISOString(),
      }, {
        onConflict: "email",
        ignoreDuplicates: false,
      });

    if (error) {
      console.error("[subscribeToNewsletter] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[subscribeToNewsletter] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to subscribe",
    };
  }
}

/**
 * Unsubscribe a user from the newsletter
 */
export async function unsubscribeFromNewsletter(
  email: string
): Promise<NewsletterResult> {
  try {
    const supabase = createSupabaseServerActionClient();

    const { error } = await supabase
      .from("newsletters")
      .update({
        is_active: false,
      })
      .eq("email", email.toLowerCase().trim());

    if (error) {
      console.error("[unsubscribeFromNewsletter] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[unsubscribeFromNewsletter] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unsubscribe",
    };
  }
}

/**
 * Check if user is subscribed to newsletter
 */
export async function isSubscribedToNewsletter(
  email: string
): Promise<boolean> {
  try {
    const supabase = createSupabaseServerActionClient();

    const { data, error } = await supabase
      .from("newsletters")
      .select("is_active")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (error || !data) {
      return false;
    }

    return data.is_active === true;
  } catch {
    return false;
  }
}
