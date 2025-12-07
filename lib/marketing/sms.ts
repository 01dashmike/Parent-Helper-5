import { getSupabaseServer } from "@/lib/supabase.server";
import { hasSupabaseServerEnv, isMarketingAutomationEnabled } from "@/lib/env";

/**
 * Send SMS via Twilio (or Supabase Functions)
 * For now, we'll queue it and process via cron job
 */
export async function sendSMS(
  phone: string,
  message: string,
  userId?: string,
  campaignId?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!hasSupabaseServerEnv() || !isMarketingAutomationEnabled()) {
    return { ok: false, error: "Marketing automation not enabled" };
  }

  // Validate phone number (UK format)
  const cleanedPhone = cleanPhoneNumber(phone);
  if (!cleanedPhone) {
    return { ok: false, error: "Invalid phone number" };
  }

  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return { ok: false, error: "Supabase not configured" };
    }

    // Queue SMS for processing
    const { error } = await supabase.from("sms_queue").insert({
      user_id: userId,
      phone: cleanedPhone,
      message,
      campaign_id: campaignId,
      status: "pending",
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to queue SMS";
    return { ok: false, error: errorMessage };
  }
}

/**
 * Process pending SMS messages (called by cron job)
 */
export async function processSMSQueue(): Promise<void> {
  if (!hasSupabaseServerEnv() || !isMarketingAutomationEnabled()) return;

  const supabase = getSupabaseServer();
  if (!supabase) return;

  try {
    // Get pending SMS messages scheduled for now or earlier
    const { data: pendingSMS } = await supabase
      .from("sms_queue")
      .select("id, user_id, phone, message, campaign_id, status, scheduled_for, created_at")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .limit(50);

    if (!pendingSMS || pendingSMS.length === 0) return;

    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFromNumber = process.env.TWILIO_FROM_NUMBER;

    // If Twilio is configured, send via Twilio
    if (twilioAccountSid && twilioAuthToken && twilioFromNumber) {
      for (const sms of pendingSMS) {
        try {
          const sid = await sendTwilioMessage({
            accountSid: twilioAccountSid,
            authToken: twilioAuthToken,
            from: twilioFromNumber,
            to: sms.phone,
            body: sms.message,
          });

          // Update SMS status
          await supabase
            .from("sms_queue")
            .update({
              status: "sent",
              twilio_message_id: sid,
              sent_at: new Date().toISOString(),
            })
            .eq("id", sms.id);
        } catch (error: unknown) {
          // Update SMS status to failed
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          await supabase
            .from("sms_queue")
            .update({
              status: "failed",
              error_message: errorMessage.slice(0, 500),
            })
            .eq("id", sms.id);
        }
      }
    } else {
      // Fallback: log SMS (for development/testing)
      console.log("[processSMSQueue] Twilio not configured, logging SMS:");
      for (const sms of pendingSMS) {
        console.log(`To: ${sms.phone}`);
        console.log(`Message: ${sms.message}`);

        // Mark as sent (for testing)
        await supabase
          .from("sms_queue")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", sms.id);
      }
    }
  } catch (error) {
    console.error("[processSMSQueue] Error:", error);
  }
}

/**
 * Clean and validate UK phone number
 */
function cleanPhoneNumber(phone: string): string | null {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");

  // Handle UK numbers
  if (cleaned.startsWith("44")) {
    cleaned = "0" + cleaned.slice(2);
  }

  // UK mobile numbers start with 07 and are 11 digits total
  // UK landlines start with 01 or 02 and are 10-11 digits
  if (cleaned.startsWith("07") && cleaned.length === 11) {
    return `+44${cleaned.slice(1)}`;
  }

  if ((cleaned.startsWith("01") || cleaned.startsWith("02")) && cleaned.length >= 10) {
    return `+44${cleaned.slice(1)}`;
  }

  // If already in international format
  if (cleaned.startsWith("44") && cleaned.length >= 12) {
    return `+${cleaned}`;
  }

  return null;
}

async function sendTwilioMessage(params: {
  accountSid: string;
  authToken: string;
  from: string;
  to: string;
  body: string;
}): Promise<string> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${params.accountSid}/Messages.json`;
  const credentials = Buffer.from(`${params.accountSid}:${params.authToken}`).toString("base64");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: params.from,
      To: params.to,
      Body: params.body,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio request failed (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  return result.sid as string;
}

