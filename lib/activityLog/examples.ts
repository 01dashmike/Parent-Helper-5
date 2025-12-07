/**
 * Example integrations for activity logging
 * Copy these patterns into your existing code
 */

import { logActivity } from "../activityLog";

/**
 * Example 1: Provider Signup
 * Add to your provider registration API route
 */
export async function exampleProviderSignup(businessName: string, contactName: string, email: string, town: string) {
  // After creating provider lead in database:
  await logActivity({
    eventType: "provider.signup",
    scope: "provider",
    level: "info",
    title: `New provider lead: ${businessName}`,
    description: `Contact: ${contactName}, ${email}, ${town}`,
    metadata: {
      businessName,
      contactName,
      email, // Will be redacted in UI
      town,
    },
  });
}

/**
 * Example 2: Provider Approved
 * Add when approving a provider lead
 */
export async function exampleProviderApproved(providerId: number, providerName: string) {
  await logActivity({
    eventType: "provider.approved",
    scope: "provider",
    level: "info",
    title: `Provider approved: ${providerName}`,
    description: `Provider ID: ${providerId}`,
    providerId,
    metadata: {
      providerName,
    },
  });
}

/**
 * Example 3: Class Created
 * Add when provider creates a new class
 */
export async function exampleClassCreated(classId: number, className: string, providerId: number, weekday: string, time: string, town: string) {
  await logActivity({
    eventType: "class.created",
    scope: "class",
    level: "info",
    title: `New class created: ${className}`,
    description: `${weekday} at ${time} in ${town}`,
    classId,
    providerId,
    metadata: {
      className,
      weekday,
      time,
      town,
    },
  });
}

/**
 * Example 4: Class Updated
 * Add when class details are updated
 */
export async function exampleClassUpdated(classId: number, className: string, changes: string[]) {
  await logActivity({
    eventType: "class.updated",
    scope: "class",
    level: "info",
    title: `Class updated: ${className}`,
    description: `Changes: ${changes.join(", ")}`,
    classId,
    metadata: {
      className,
      changes,
    },
  });
}

/**
 * Example 5: Booking Completed
 * Add when booking is successfully created
 */
export async function exampleBookingCompleted(bookingId: string, classId: number, amountCents: number) {
  await logActivity({
    eventType: "booking.completed",
    scope: "booking",
    level: "info",
    title: "New booking completed",
    description: `Amount: £${(amountCents / 100).toFixed(2)}`,
    bookingId,
    classId,
    metadata: {
      amountCents,
      currency: "GBP",
    },
  });
}

/**
 * Example 6: Booking Cancelled
 * Add when booking is cancelled
 */
export async function exampleBookingCancelled(bookingId: string, reason?: string) {
  await logActivity({
    eventType: "booking.cancelled",
    scope: "booking",
    level: "warning",
    title: "Booking cancelled",
    description: reason || "No reason provided",
    bookingId,
    metadata: {
      reason,
    },
  });
}

/**
 * Example 7: Cron Job Started
 * Add at the start of your cron job
 */
export async function exampleCronStarted(jobName: string) {
  await logActivity({
    eventType: "cron.weekly",
    scope: "system",
    level: "info",
    title: `${jobName} started`,
    description: `Scheduled job execution started`,
    metadata: {
      jobName,
    },
  });
}

/**
 * Example 8: Cron Job Completed
 * Add at the end of your cron job with summary
 */
export async function exampleCronCompleted(jobName: string, summary: Record<string, number>) {
  await logActivity({
    eventType: "cron.weekly",
    scope: "system",
    level: "info",
    title: `${jobName} completed`,
    description: `Processed: ${Object.entries(summary).map(([k, v]) => `${k}: ${v}`).join(", ")}`,
    metadata: {
      jobName,
      summary,
    },
  });
}

/**
 * Example 9: System Error
 * Add in catch blocks for critical errors
 */
export async function exampleSystemError(error: Error, context: string) {
  await logActivity({
    eventType: "system.error",
    scope: "system",
    level: "error",
    title: `Error in ${context}`,
    description: error.message,
    metadata: {
      error: error.message,
      stack: error.stack,
      context,
    },
  });
}

