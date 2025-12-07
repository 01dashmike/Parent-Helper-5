/**
 * Test utilities for marketing automation
 * Use these to simulate events and test automation flows
 */

import { triggerAutomation, logUserActivity } from "./automation";
import { getSupabaseServer } from "@/lib/supabase.server";
import { hasSupabaseServerEnv, isMarketingAutomationEnabled } from "@/lib/env";

/**
 * Simulate a new user signup
 */
export async function simulateUserSignup(userId: string, email: string, firstName?: string) {
  if (!hasSupabaseServerEnv() || !isMarketingAutomationEnabled()) {
    console.log("[simulateUserSignup] Marketing automation not enabled");
    return;
  }

  console.log(`[TEST] Simulating user signup for ${email}`);

  // Log activity
  await logUserActivity(userId, "signup", { email });

  // Trigger automation
  await triggerAutomation("user_signup", {
    userId,
    email,
    firstName: firstName || email.split("@")[0],
  });

  console.log(`[TEST] Welcome email queued for ${email}`);
}

/**
 * Simulate a first booking
 */
export async function simulateFirstBooking(userId: string, email: string, bookingId?: string) {
  if (!hasSupabaseServerEnv() || !isMarketingAutomationEnabled()) {
    console.log("[simulateFirstBooking] Marketing automation not enabled");
    return;
  }

  console.log(`[TEST] Simulating first booking for ${email}`);

  // Log activity
  await logUserActivity(userId, "booking", { bookingId });

  // Trigger automation
  await triggerAutomation("first_booking", {
    userId,
    email,
    firstName: email.split("@")[0],
  });

  console.log(`[TEST] First booking email queued for ${email}`);
}

/**
 * Simulate user inactivity (30 days)
 */
export async function simulateInactivity(userId: string, email: string) {
  if (!hasSupabaseServerEnv() || !isMarketingAutomationEnabled()) {
    console.log("[simulateInactivity] Marketing automation not enabled");
    return;
  }

  console.log(`[TEST] Simulating inactivity for ${email}`);

  const supabase = getSupabaseServer();
  if (supabase) {
    // Set last activity to 30+ days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 31);

    await supabase.from("user_activity_log").insert({
      user_id: userId,
      activity_type: "login",
      metadata: {},
      created_at: thirtyDaysAgo.toISOString(),
    });
  }

  // Trigger automation
  await triggerAutomation("inactivity", {
    userId,
    email,
    firstName: email.split("@")[0],
  });

  console.log(`[TEST] Re-engagement email queued for ${email}`);
}

/**
 * Check email queue for a user
 */
export async function checkEmailQueue(userId: string) {
  if (!hasSupabaseServerEnv() || !isMarketingAutomationEnabled()) {
    return [];
  }

  const supabase = getSupabaseServer();
  if (!supabase) return [];

  const { data } = await supabase
    .from("email_queue")
    .select("id, user_id, email, campaign_id, template_id, subject, html_content, text_content, status, scheduled_for, sent_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100); // Reasonable limit for testing

  return data || [];
}

/**
 * Check SMS queue for a user
 */
export async function checkSMSQueue(userId: string) {
  if (!hasSupabaseServerEnv() || !isMarketingAutomationEnabled()) {
    return [];
  }

  const supabase = getSupabaseServer();
  if (!supabase) return [];

  const { data } = await supabase
    .from("sms_queue")
    .select("id, user_id, phone, message, campaign_id, status, scheduled_for, sent_at, twilio_message_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100); // Reasonable limit for testing

  return data || [];
}

