/**
 * Automation Flow Execution
 * 
 * Functions to run automation flows
 */

import { getSupabaseServer } from "@/lib/supabase/server";
import { sendEmailNotification, sendEmailNotificationsBatch, type SendEmailNotificationParams } from "./send";
import {
  findParentsNeedingBookingReminder,
  findParentsToReactivate,
  findParentsForCancellationSuggestions,
  findProvidersForWeeklyDigest,
  findProvidersWithIncompleteOnboarding,
} from "./flows";

export type AutomationRunResult = {
  success: boolean;
  processed: number;
  sent: number;
  errors: number;
  error?: string;
};

/**
 * Run automation flow
 */
export async function runFlow(
  flowKey: string,
  now: Date = new Date()
): Promise<AutomationRunResult> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { success: false, processed: 0, sent: 0, errors: 0, error: "Database not configured" };
  }

  // Get flow config
  const { data: flow } = await supabase
    .from("automation_flows")
    .select("*")
    .eq("key", flowKey)
    .eq("is_enabled", true)
    .single();

  if (!flow) {
    return {
      success: false,
      processed: 0,
      sent: 0,
      errors: 0,
      error: `Flow ${flowKey} not found or disabled`,
    };
  }

  let processed = 0;
  let sent = 0;
  let errors = 0;

  try {
    switch (flowKey) {
      case "parent_booking_reminder":
        const reminders = await findParentsNeedingBookingReminder(now);
        processed = reminders.length;

        // Parallelize email sending for better performance
        const reminderNotifications: SendEmailNotificationParams[] = reminders.map((reminder) => ({
          userId: reminder.userId,
          to: reminder.parentEmail,
          templateKey: "parent_booking_reminder",
          context: {
            first_name: reminder.parentFirstName,
            child_name: reminder.childName || "your child",
            class_name: reminder.className,
            class_time: reminder.classTime.toLocaleString("en-GB", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            class_location: reminder.classLocation,
            provider_name: reminder.providerName,
            manage_booking_url: reminder.manageBookingUrl,
          },
          transactional: true,
          metadata: { booking_id: reminder.bookingId },
        }));

        const reminderResults = await sendEmailNotificationsBatch(reminderNotifications);
        sent = reminderResults.filter((r) => r.success).length;
        errors = reminderResults.filter((r) => !r.success).length;
        break;

      case "parent_lapsed_reactivation":
        const lapsed = await findParentsToReactivate(now);
        processed = lapsed.length;

        // Parallelize email sending
        const lapsedNotifications: SendEmailNotificationParams[] = lapsed.map((parent) => ({
          userId: parent.userId,
          to: parent.parentEmail,
          templateKey: "parent_lapsed_reactivation",
          context: {
            first_name: parent.parentFirstName,
            last_class_name: parent.lastClass || "your last class",
            city: parent.city || "your area",
            recommended_classes: parent.recommendedClasses,
          },
          transactional: false, // Marketing
          metadata: {},
        }));

        const lapsedResults = await sendEmailNotificationsBatch(lapsedNotifications);
        sent = lapsedResults.filter((r) => r.success).length;
        errors = lapsedResults.filter((r) => !r.success).length;
        break;

      case "parent_cancellation_suggestions":
        // This is triggered by booking cancellation, not cron
        // Placeholder for now
        break;

      case "provider_weekly_digest":
        const providers = await findProvidersForWeeklyDigest(now);
        processed = providers.length;

        for (const provider of providers) {
          const viewsChange =
            provider.viewsLastWeek > 0
              ? Math.round(
                  ((provider.viewsThisWeek - provider.viewsLastWeek) / provider.viewsLastWeek) * 100
                )
              : 0;
          const bookingsChange =
            provider.bookingsLastWeek > 0
              ? Math.round(
                  ((provider.bookingsThisWeek - provider.bookingsLastWeek) /
                    provider.bookingsLastWeek) *
                    100
                )
              : 0;

          // Get provider user_id
          const { data: providerUser } = await supabase
            .from("providers_users")
            .select("user_id")
            .eq("provider_id", provider.providerId)
            .single();

          if (!providerUser?.user_id) continue;

          const result = await sendEmailNotification({
            userId: providerUser.user_id,
            to: provider.providerEmail,
            templateKey: "provider_weekly_digest",
            context: {
              provider_name: provider.providerName,
              views_this_week: provider.viewsThisWeek,
              views_change: viewsChange >= 0 ? `+${viewsChange}` : `${viewsChange}`,
              bookings_this_week: provider.bookingsThisWeek,
              bookings_change: bookingsChange >= 0 ? `+${bookingsChange}` : `${bookingsChange}`,
              revenue_this_week: provider.revenueThisWeek.toFixed(2),
              top_class_name: provider.topClass?.name || "N/A",
              top_class_views: provider.topClass?.views || 0,
              top_class_bookings: provider.topClass?.bookings || 0,
              dashboard_url: provider.dashboardUrl,
            },
            transactional: false,
            metadata: { provider_id: provider.providerId },
          });

          if (result.success) {
            sent++;
          } else {
            errors++;
          }
        }
        break;

      case "provider_onboarding_nudge":
        const incompleteProviders = await findProvidersWithIncompleteOnboarding(now);
        processed = incompleteProviders.length;

        // Parallelize email sending
        const nudgeNotifications: SendEmailNotificationParams[] = incompleteProviders.map((provider) => ({
          userId: provider.userId,
          to: provider.providerEmail,
          templateKey:
            provider.daysSinceStart >= 7
              ? "provider_onboarding_nudge_7d"
              : "provider_onboarding_nudge_2d",
          context: {
            provider_name: provider.providerName,
            current_step: provider.currentStep,
            onboarding_url: provider.onboardingUrl,
          },
          transactional: false,
          metadata: { provider_id: provider.providerId, current_step: provider.currentStep },
        }));

        const nudgeResults = await sendEmailNotificationsBatch(nudgeNotifications);
        sent = nudgeResults.filter((r) => r.success).length;
        errors = nudgeResults.filter((r) => !r.success).length;
        break;

      default:
        return {
          success: false,
          processed: 0,
          sent: 0,
          errors: 0,
          error: `Unknown flow: ${flowKey}`,
        };
    }

    // Log automation run
    await logAutomationRun({
      flowKey,
      status: errors === 0 ? "success" : errors < processed ? "partial" : "failed",
      processedCount: processed,
      sentCount: sent,
      errorCount: errors,
    });

    return {
      success: errors === 0,
      processed,
      sent,
      errors,
    };
  } catch (error: unknown) {
    console.error(`[runFlow] Error running ${flowKey}:`, error);

    await logAutomationRun({
      flowKey,
      status: "failed",
      processedCount: processed,
      sentCount: sent,
      errorCount: errors,
      metadata: { error: error instanceof Error ? error.message : "Unknown error" },
    });

    return {
      success: false,
      processed,
      sent,
      errors,
      error: error instanceof Error ? error.message : "Failed to run flow",
    };
  }
}

/**
 * Log automation run
 */
async function logAutomationRun(params: {
  flowKey: string;
  status: "success" | "partial" | "failed";
  processedCount: number;
  sentCount: number;
  errorCount: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = getSupabaseServer();
  if (!supabase) return;

  await supabase.from("automation_runs").insert({
    flow_key: params.flowKey,
    run_at: new Date().toISOString(),
    status: params.status,
    processed_count: params.processedCount,
    sent_count: params.sentCount,
    error_count: params.errorCount,
    metadata: params.metadata || {},
  });
}

/**
 * Send cancellation suggestions (called from booking cancellation flow)
 */
export async function sendCancellationSuggestions(
  bookingId: number,
  cancelledClassId: number,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const suggestion = await findParentsForCancellationSuggestions(
    bookingId,
    cancelledClassId,
    userId
  );

  if (!suggestion) {
    return { success: false, error: "Could not generate suggestions" };
  }

  const result = await sendEmailNotification({
    userId: suggestion.userId,
    to: suggestion.parentEmail,
    templateKey: "parent_cancellation_suggestions",
    context: {
      first_name: suggestion.parentFirstName,
      cancelled_class_name: suggestion.cancelledClassName,
      original_time: suggestion.originalTime,
      suggested_classes: suggestion.suggestedClasses,
    },
    transactional: true,
    metadata: { booking_id: bookingId, cancelled_class_id: cancelledClassId },
  });

  return { success: result.success, error: result.error };
}

