import { NextResponse } from "next/server";
import { sendTransactional } from "@/lib/emails/sendTransactional";

type ContactFormData = {
  name: string;
  email: string;
  reason: string;
  message: string;
};

const REASON_LABELS: Record<string, string> = {
  booking: "Question about booking",
  classes: "Question about classes",
  provider: "Provider question",
  website: "Website issue",
  advertising: "Advertising with us",
  other: "Other",
};

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function sanitizeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
}

function generateEmailHtml(data: ContactFormData): string {
  const reasonLabel = REASON_LABELS[data.reason] || data.reason;
  const timestamp = new Date().toLocaleString("en-GB", {
    dateStyle: "full",
    timeStyle: "long",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Form Submission</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #4A6B66; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">New Contact Form Submission</h1>
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none;">
    <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="color: #4A6B66; margin-top: 0; font-size: 18px; border-bottom: 2px solid #4A6B66; padding-bottom: 10px;">Contact Details</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #555; width: 140px;">Name:</td>
          <td style="padding: 10px 0; color: #333;">${sanitizeHtml(data.name)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #555;">Email:</td>
          <td style="padding: 10px 0; color: #333;">
            <a href="mailto:${sanitizeHtml(data.email)}" style="color: #4A6B66; text-decoration: none;">
              ${sanitizeHtml(data.email)}
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #555;">Reason:</td>
          <td style="padding: 10px 0;">
            <span style="background-color: #C97C5C; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px;">
              ${sanitizeHtml(reasonLabel)}
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #555;">Submitted:</td>
          <td style="padding: 10px 0; color: #666; font-size: 14px;">${timestamp}</td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: white; padding: 20px; border-radius: 8px;">
      <h2 style="color: #4A6B66; margin-top: 0; font-size: 18px; border-bottom: 2px solid #4A6B66; padding-bottom: 10px;">Message</h2>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; border-left: 4px solid #4A6B66; color: #333; white-space: pre-wrap; word-wrap: break-word;">
${sanitizeHtml(data.message)}
      </div>
    </div>
    
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
      <p style="margin: 0;">This message was sent via the Parent Helper contact form</p>
      <p style="margin: 5px 0 0 0;">Reply directly to this email to respond to ${sanitizeHtml(data.name)}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function generateEmailText(data: ContactFormData): string {
  const reasonLabel = REASON_LABELS[data.reason] || data.reason;
  const timestamp = new Date().toLocaleString("en-GB", {
    dateStyle: "full",
    timeStyle: "long",
  });

  return `
NEW CONTACT FORM SUBMISSION

Contact Details:
----------------
Name: ${data.name}
Email: ${data.email}
Reason: ${reasonLabel}
Submitted: ${timestamp}

Message:
--------
${data.message}

---
This message was sent via the Parent Helper contact form.
Reply directly to this email to respond to ${data.name}.
  `.trim();
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { name, email, reason, message } = body as ContactFormData;

    // Validate required fields
    if (!name || !email || !reason || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate field lengths
    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Validate reason
    if (!REASON_LABELS[reason]) {
      return NextResponse.json(
        { error: "Invalid reason selected" },
        { status: 400 }
      );
    }

    // Prepare email content
    const reasonLabel = REASON_LABELS[reason];
    const emailHtml = generateEmailHtml({ name, email, reason, message });
    const emailText = generateEmailText({ name, email, reason, message });

    // Send email
    const result = await sendTransactional({
      to: "notification@parenthelper.co.uk",
      subject: `Contact Form: ${reasonLabel} - ${name}`,
      html: emailHtml,
      text: emailText,
      replyTo: email,
      type: "contact_form",
    });

    if (!result.ok) {
      console.error("Failed to send contact form email:", result.error);
      return NextResponse.json(
        { error: "Failed to send message. Please try again later." },
        { status: 500 }
      );
    }

    // Success response
    return NextResponse.json(
      { success: true, message: "Message sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
