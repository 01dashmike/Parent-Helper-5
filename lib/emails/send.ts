/**
 * Email Sending Abstraction
 * 
 * Unified email sending interface (uses SendGrid)
 */

import { sendTransactional } from "./sendTransactional";

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
};

export type SendResult = 
  | { success: true; messageId?: string }
  | { success: false; error: string };

/**
 * Send email
 * 
 * Uses existing SendGrid infrastructure
 */
export async function sendEmail(
  params: SendEmailParams
): Promise<SendResult> {
  try {
    const result = await sendTransactional({
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
    });

    if ("error" in result) {
      return { success: false, error: result.error };
    }

    return { success: true, messageId: undefined };
  } catch (error) {
    console.error("[sendEmail] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

