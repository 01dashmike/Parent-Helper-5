/**
 * Accountability Email System
 * 
 * Logic for sending scheduled accountability emails to wellness users
 */

"use server";

import { createSupabaseServerActionClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/emails/send";
import { wrapAccountabilityEmail, substituteVariables } from "@/lib/emails/templates/accountability";

export type AccountabilityEmailTemplate = {
  id: string;
  title: string;
  subject: string;
  body_html: string;
  body_text: string;
  email_type: "diet" | "exercise" | "supplements" | "general";
  frequency: "weekly" | "biweekly" | "monthly";
  is_active: boolean;
  scheduled_send_day?: number;
};

/**
 * Get all active accountability email templates
 */
export async function getActiveAccountabilityTemplates() {
  try {
    const supabase = createSupabaseServerActionClient();
    
    const { data, error } = await supabase
      .from("wellness_accountability_emails")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getActiveAccountabilityTemplates] Error:", error);
      return [];
    }

    return data as AccountabilityEmailTemplate[];
  } catch (error) {
    console.error("[getActiveAccountabilityTemplates] Error:", error);
    return [];
  }
}

/**
 * Get users eligible for accountability emails
 */
export async function getEligibleUsers(frequency: "weekly" | "biweekly" | "monthly") {
  try {
    const supabase = createSupabaseServerActionClient();
    
    const { data, error } = await supabase
      .from("wellness_users")
      .select("*")
      .eq("accountability_emails_enabled", true)
      .eq("accountability_frequency", frequency);

    if (error) {
      console.error("[getEligibleUsers] Error:", error);
      return [];
    }

    return data;
  } catch (error) {
    console.error("[getEligibleUsers] Error:", error);
    return [];
  }
}

/**
 * Check if user has already received this template recently
 */
async function hasRecentSend(
  userId: string,
  templateId: string,
  withinDays: number
): Promise<boolean> {
  try {
    const supabase = createSupabaseServerActionClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - withinDays);

    const { data, error } = await supabase
      .from("wellness_email_sends")
      .select("id")
      .eq("user_id", userId)
      .eq("email_template_id", templateId)
      .eq("status", "sent")
      .gte("sent_at", cutoffDate.toISOString())
      .limit(1);

    if (error) {
      console.error("[hasRecentSend] Error:", error);
      return true; // Err on side of caution
    }

    return (data?.length || 0) > 0;
  } catch {
    return true;
  }
}

/**
 * Record email send
 */
async function recordEmailSend(
  userId: string,
  templateId: string,
  status: "sent" | "failed",
  errorMessage?: string
) {
  try {
    const supabase = createSupabaseServerActionClient();
    
    await supabase.from("wellness_email_sends").insert({
      user_id: userId,
      email_template_id: templateId,
      status,
      error_message: errorMessage,
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[recordEmailSend] Error:", error);
  }
}

/**
 * Send accountability email to a single user
 */
export async function sendAccountabilityEmail(
  userId: string,
  userEmail: string,
  template: AccountabilityEmailTemplate
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already sent recently
    const frequencyDays = {
      weekly: 7,
      biweekly: 14,
      monthly: 30,
    };
    
    const withinDays = frequencyDays[template.frequency];
    const alreadySent = await hasRecentSend(userId, template.id, withinDays);
    
    if (alreadySent) {
      return { success: false, error: "Already sent recently" };
    }

    // Substitute variables
    const variables = {
      email: userEmail,
      unsubscribe_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://parenthelper.co.uk'}/wellness/unsubscribe?email=${encodeURIComponent(userEmail)}`,
    };

    const subject = substituteVariables(template.subject, variables);
    const bodyHtml = substituteVariables(template.body_html, variables);
    const bodyText = substituteVariables(template.body_text, variables);

    // Wrap with header/footer
    const { html, text } = wrapAccountabilityEmail({
      emailType: template.email_type,
      bodyHtml,
      bodyText,
      unsubscribeUrl: variables.unsubscribe_url,
    });

    // Send email
    const result = await sendEmail({
      to: userEmail,
      subject,
      html,
      text,
    });

    if (result.success) {
      await recordEmailSend(userId, template.id, "sent");
      return { success: true };
    } else {
      await recordEmailSend(userId, template.id, "failed", result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("[sendAccountabilityEmail] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await recordEmailSend(userId, template.id, "failed", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Process accountability emails for a given frequency
 * This should be called by a cron job
 */
export async function processAccountabilityEmails(
  frequency: "weekly" | "biweekly" | "monthly"
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  try {
    // Get active templates for this frequency
    const allTemplates = await getActiveAccountabilityTemplates();
    const templates = allTemplates.filter(t => t.frequency === frequency);

    if (templates.length === 0) {
      console.log(`[processAccountabilityEmails] No active templates for ${frequency}`);
      return { sent, failed };
    }

    // Get eligible users
    const users = await getEligibleUsers(frequency);
    
    if (users.length === 0) {
      console.log(`[processAccountabilityEmails] No eligible users for ${frequency}`);
      return { sent, failed };
    }

    console.log(`[processAccountabilityEmails] Processing ${users.length} users with ${templates.length} templates`);

    // Send emails
    for (const user of users) {
      // Send one template per user (rotate through templates)
      const template = templates[Math.floor(Math.random() * templates.length)];
      
      const result = await sendAccountabilityEmail(
        user.user_id,
        user.email,
        template
      );

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      // Add delay between sends to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`[processAccountabilityEmails] Complete: ${sent} sent, ${failed} failed`);
  } catch (error) {
    console.error("[processAccountabilityEmails] Error:", error);
  }

  return { sent, failed };
}
