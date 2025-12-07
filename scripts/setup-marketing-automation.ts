/**
 * Setup script to initialize default marketing campaigns and automation rules
 * Run this after enabling MARKETING_AUTOMATION_ENABLED=true
 */

import { getSupabaseServer } from "../lib/supabase.server";
import { emailTemplates } from "../lib/marketing/email-templates";

async function setupMarketingAutomation() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    console.error("Supabase not configured");
    process.exit(1);
  }

  console.log("Setting up marketing automation...");

  // Create default campaigns
  const campaigns = [
    {
      name: "Welcome Series - Email 1",
      type: "welcome",
      status: "active",
      enabled: true,
      metadata: {
        subject: emailTemplates.welcome.subject,
        html_content: emailTemplates.welcome.html,
        text_content: emailTemplates.welcome.text,
      },
    },
    {
      name: "Welcome Series - Email 2 (Benefits)",
      type: "welcome",
      status: "active",
      enabled: true,
      metadata: {
        subject: emailTemplates.welcomeBenefits.subject,
        html_content: emailTemplates.welcomeBenefits.html,
        text_content: emailTemplates.welcomeBenefits.text,
      },
    },
    {
      name: "Welcome Series - Email 3 (Saved Search)",
      type: "welcome",
      status: "active",
      enabled: true,
      metadata: {
        subject: emailTemplates.welcomeSavedSearch.subject,
        html_content: emailTemplates.welcomeSavedSearch.html,
        text_content: emailTemplates.welcomeSavedSearch.text,
      },
    },
    {
      name: "First Booking Congratulations",
      type: "first_booking",
      status: "active",
      enabled: true,
      metadata: {
        subject: emailTemplates.firstBooking.subject,
        html_content: emailTemplates.firstBooking.html,
        text_content: emailTemplates.firstBooking.text,
      },
    },
    {
      name: "Inactivity Re-engagement",
      type: "inactivity",
      status: "active",
      enabled: true,
      metadata: {
        subject: emailTemplates.inactivity.subject,
        html_content: emailTemplates.inactivity.html,
        text_content: emailTemplates.inactivity.text,
      },
    },
    {
      name: "Wallet Balance Nudge",
      type: "wallet_nudge",
      status: "active",
      enabled: true,
      metadata: {
        subject: emailTemplates.walletNudge.subject,
        html_content: emailTemplates.walletNudge.html,
        text_content: emailTemplates.walletNudge.text,
      },
    },
    {
      name: "Referral Reminder",
      type: "referral_reminder",
      status: "active",
      enabled: true,
      metadata: {
        subject: emailTemplates.referralReminder.subject,
        html_content: emailTemplates.referralReminder.html,
        text_content: emailTemplates.referralReminder.text,
      },
    },
  ];

  const campaignIds: Record<string, string> = {};

  for (const campaign of campaigns) {
    const { data, error } = await supabase
      .from("marketing_campaigns")
      .insert(campaign)
      .select()
      .single();

    if (error) {
      console.error(`Error creating campaign ${campaign.name}:`, error);
      continue;
    }

    campaignIds[campaign.type] = data.id;
    console.log(`✅ Created campaign: ${campaign.name}`);
  }

  // Create default automation rules
  const rules = [
    {
      name: "Welcome Email on Signup",
      trigger_type: "user_signup",
      trigger_config: {},
      action_type: "send_email",
      campaign_id: campaignIds.welcome,
      enabled: true,
    },
    {
      name: "First Booking Congratulations",
      trigger_type: "first_booking",
      trigger_config: {},
      action_type: "send_email",
      campaign_id: campaignIds.first_booking,
      enabled: true,
    },
    {
      name: "Re-engage After 30 Days Inactivity",
      trigger_type: "inactivity",
      trigger_config: { days: 30 },
      action_type: "send_email",
      campaign_id: campaignIds.inactivity,
      enabled: true,
    },
    {
      name: "Saved Search Digest (7 days)",
      trigger_type: "saved_search",
      trigger_config: { days: 7 },
      action_type: "send_email",
      campaign_id: null, // Will use saved search digest template
      enabled: true,
    },
    {
      name: "Wallet Balance Nudge (>£10)",
      trigger_type: "wallet_balance",
      trigger_config: { balance_cents: 1000 }, // £10
      action_type: "send_email",
      campaign_id: campaignIds.wallet_nudge,
      enabled: true,
    },
    {
      name: "Referral Reminder (14 days)",
      trigger_type: "referral_pending",
      trigger_config: { days: 14 },
      action_type: "send_email",
      campaign_id: campaignIds.referral_reminder,
      enabled: true,
    },
  ];

  for (const rule of rules) {
    const { error } = await supabase.from("automation_rules").insert(rule);

    if (error) {
      console.error(`Error creating rule ${rule.name}:`, error);
      continue;
    }

    console.log(`✅ Created rule: ${rule.name}`);
  }

  console.log("\n✅ Marketing automation setup complete!");
  console.log("\nNext steps:");
  console.log("1. Set up cron jobs:");
  console.log("   - /api/marketing/process-queue (every 5 minutes)");
  console.log("   - /api/cron/check-inactivity (daily)");
  console.log("2. Configure SendGrid webhook: /api/marketing/webhooks/sendgrid");
  console.log("3. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER for SMS");
}

setupMarketingAutomation().catch(console.error);

