/**
 * Notification Sending
 * 
 * Single sending abstraction that respects user preferences and logs events
 * Optimized with caching and batch operations
 */

import { getSupabaseServer } from "@/lib/supabase/server";
import { getTemplate, renderTemplate } from "./templates";
import { sendEmail } from "@/lib/emails/send"; // Assuming this exists or create it

export type SendEmailNotificationParams = {
  userId: string;
  to: string;
  templateKey: string;
  context: Record<string, unknown>;
  transactional?: boolean;
  metadata?: Record<string, unknown>;
};

// In-memory cache for user notification settings (1 minute TTL for freshness)
const settingsCache = new Map<string, { settings: any; expiresAt: number }>();
const SETTINGS_CACHE_TTL_MS = 60 * 1000; // 1 minute

/**
 * Get user notification settings with caching
 */
async function getUserSettings(userId: string) {
  // Check cache first
  const cached = settingsCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.settings;
  }

  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data: settings } = await supabase
    .from("user_notification_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Cache the settings
  if (settings) {
    settingsCache.set(userId, {
      settings,
      expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS,
    });
  }

  return settings;
}

/**
 * Send email notification
 * 
 * Checks user preferences, renders template, sends email, and logs event
 */
export async function sendEmailNotification(
  params: SendEmailNotificationParams
): Promise<{ success: boolean; error?: string; eventId?: number }> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  try {
    // Get user notification settings (cached)
    const settings = await getUserSettings(params.userId);

    // Check opt-in status
    if (params.transactional) {
      // Transactional emails (reminders, confirmations)
      if (settings && !settings.email_transactional_opt_in) {
        await logNotificationEvent({
          userId: params.userId,
          templateKey: params.templateKey,
          channel: "email",
          status: "skipped",
          reason: "user_opted_out_transactional",
          metadata: params.metadata,
        });
        return { success: false, error: "User opted out of transactional emails" };
      }
    } else {
      // Marketing emails
      if (settings && !settings.email_marketing_opt_in) {
        await logNotificationEvent({
          userId: params.userId,
          templateKey: params.templateKey,
          channel: "email",
          status: "skipped",
          reason: "user_opted_out_marketing",
          metadata: params.metadata,
        });
        return { success: false, error: "User opted out of marketing emails" };
      }
    }

    // Get template
    const template = await getTemplate(params.templateKey);
    if (!template) {
      await logNotificationEvent({
        userId: params.userId,
        templateKey: params.templateKey,
        channel: "email",
        status: "failed",
        reason: "template_not_found",
        metadata: params.metadata,
      });
      return { success: false, error: "Template not found" };
    }

    // Render template
    const rendered = await renderTemplate(template, params.context);

    // Send email (using existing email infrastructure)
    const emailResult = await sendEmail({
      to: params.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    if (!emailResult.success) {
      await logNotificationEvent({
        userId: params.userId,
        templateKey: params.templateKey,
        channel: "email",
        status: "failed",
        reason: emailResult.error || "email_send_failed",
        metadata: params.metadata,
      });
      return { success: false, error: emailResult.error };
    }

    // Log successful send
    const eventResult = await logNotificationEvent({
      userId: params.userId,
      templateKey: params.templateKey,
      channel: "email",
      status: "sent",
      metadata: params.metadata,
    });

    return { success: true, eventId: eventResult.eventId };
  } catch (error) {
    console.error("[sendEmailNotification] Error:", error);
    await logNotificationEvent({
      userId: params.userId,
      templateKey: params.templateKey,
      channel: "email",
      status: "failed",
      reason: error instanceof Error ? error.message : "unknown_error",
      metadata: params.metadata,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send notification",
    };
  }
}

/**
 * Log notification event
 */
export async function logNotificationEvent(params: {
  userId: string;
  templateKey: string;
  channel: "email" | "in_app" | "sms";
  status: "sent" | "bounced" | "failed" | "skipped";
  reason?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; eventId?: number; error?: string }> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  try {
    const { data: event, error } = await supabase
      .from("notification_events")
      .insert({
        user_id: params.userId,
        template_key: params.templateKey,
        channel: params.channel,
        status: params.status,
        reason: params.reason || null,
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error("[logNotificationEvent] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, eventId: event.id };
  } catch (error) {
    console.error("[logNotificationEvent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to log event",
    };
  }
}

/**
 * Check if user should receive notification (cached)
 */
export async function shouldSendNotification(
  userId: string,
  transactional: boolean = false
): Promise<boolean> {
  const settings = await getUserSettings(userId);

  if (!settings) {
    // Default: allow if no settings exist
    return true;
  }

  return transactional ? settings.email_transactional_opt_in : settings.email_marketing_opt_in;
}

/**
 * Send multiple email notifications in parallel (batch operation)
 * More efficient than sequential sending for automation flows
 */
export async function sendEmailNotificationsBatch(
  notifications: SendEmailNotificationParams[]
): Promise<Array<{ success: boolean; error?: string; eventId?: number; index: number }>> {
  // Send all emails in parallel with concurrency limit to avoid overwhelming the email service
  const BATCH_SIZE = 10; // Process 10 emails at a time
  const results: Array<{ success: boolean; error?: string; eventId?: number; index: number }> = [];

  for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
    const batch = notifications.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (params, batchIndex) => {
        const result = await sendEmailNotification(params);
        return { ...result, index: i + batchIndex };
      })
    );
    results.push(...batchResults);
  }

  return results;
}


