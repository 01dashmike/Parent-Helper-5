/**
 * Integration hooks for marketing automation
 * Call these functions from your existing user signup/booking flows
 * PERF: All functions are fire-and-forget to avoid blocking user flows
 */

import { triggerAutomation, logUserActivity } from "./automation";
import { isMarketingAutomationEnabled } from "@/lib/env";

/**
 * Call this after a user signs up
 * PERF: Fire-and-forget, doesn't block signup flow
 */
export function onUserSignup(userId: string, email: string, metadata?: { firstName?: string }): void {
  if (!isMarketingAutomationEnabled()) return;

  // Fire and forget - don't block signup
  Promise.resolve().then(async () => {
    try {
      logUserActivity(userId, "signup", { email });
      await triggerAutomation("user_signup", {
        userId,
        email,
        firstName: metadata?.firstName || email.split("@")[0],
      });
    } catch (error) {
      console.error("[onUserSignup] Error:", error);
    }
  });
}

/**
 * Call this after a user makes their first booking
 * PERF: Fire-and-forget, doesn't block booking flow
 */
export function onFirstBooking(userId: string, email: string, bookingId?: string): void {
  if (!isMarketingAutomationEnabled()) return;

  // Fire and forget - don't block booking
  Promise.resolve().then(async () => {
    try {
      logUserActivity(userId, "booking", { bookingId });
      await triggerAutomation("first_booking", {
        userId,
        email,
        firstName: email.split("@")[0],
      });
    } catch (error) {
      console.error("[onFirstBooking] Error:", error);
    }
  });
}

/**
 * Call this when a user saves a search
 * PERF: Fire-and-forget, doesn't block user action
 */
export function onSavedSearch(userId: string): void {
  if (!isMarketingAutomationEnabled()) return;

  // Fire and forget
  Promise.resolve().then(async () => {
    try {
      logUserActivity(userId, "search", {});
      // Saved search digest is handled by cron job checking saved_searches table
    } catch (error) {
      console.error("[onSavedSearch] Error:", error);
    }
  });
}

/**
 * Call this when a user logs in
 * PERF: Fire-and-forget, doesn't block login flow
 */
export function onUserLogin(userId: string): void {
  if (!isMarketingAutomationEnabled()) return;

  // Fire and forget - don't block login
  Promise.resolve().then(async () => {
    try {
      logUserActivity(userId, "login", {});
    } catch (error) {
      console.error("[onUserLogin] Error:", error);
    }
  });
}
