/**
 * Accountability Email Template
 * 
 * Template for accountability emails with variable substitution
 */

export interface AccountabilityEmailData {
  recipientName?: string;
  emailType: "diet" | "exercise" | "supplements" | "general";
  bodyHtml: string;
  bodyText: string;
  unsubscribeUrl?: string;
}

/**
 * Wrap accountability email content with consistent header/footer
 */
export function wrapAccountabilityEmail(data: AccountabilityEmailData) {
  const typeEmoji = {
    diet: "🥗",
    exercise: "💪",
    supplements: "💊",
    general: "🌟",
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Parent Helper Wellness Check-in</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2D3748; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6B9080 0%, #A4C3B2 100%); padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 10px 0 0 0; opacity: 0.9; }
    .content { background: white; padding: 30px 20px; }
    .footer { background: #F7FAFC; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; color: #718096; font-size: 14px; }
    .footer a { color: #6B9080; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
    a { color: #6B9080; }
    .btn { display: inline-block; background: #6B9080; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 10px 0; }
    .btn:hover { background: #5A7D6F; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${typeEmoji[data.emailType]} Parent Helper Wellness</h1>
    <p>Your wellness check-in</p>
  </div>
  
  <div class="content">
    ${data.bodyHtml}
  </div>
  
  <div class="footer">
    <p><strong>Parent Helper Wellness</strong></p>
    <p>Supporting your family's health and wellbeing journey</p>
    <p style="margin-top: 15px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://parenthelper.co.uk'}/wellness">Visit Wellness Hub</a>
      ${data.unsubscribeUrl ? ` | <a href="${data.unsubscribeUrl}">Unsubscribe</a>` : ''}
    </p>
  </div>
</body>
</html>
  `;

  const text = `
Parent Helper Wellness - Your wellness check-in

${data.bodyText}

---
Parent Helper Wellness
Supporting your family's health and wellbeing journey

Visit: ${process.env.NEXT_PUBLIC_APP_URL || 'https://parenthelper.co.uk'}/wellness
${data.unsubscribeUrl ? `Unsubscribe: ${data.unsubscribeUrl}` : ''}
  `.trim();

  return { html, text };
}

/**
 * Substitute variables in email template
 */
export function substituteVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}
