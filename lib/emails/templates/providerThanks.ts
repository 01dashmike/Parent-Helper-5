export function providerThanks(name: string): { html: string; text: string } {
  const safeName = name?.trim() || "there";

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#fafafa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#2f2f2f;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fafafa;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:12px;padding:32px 32px 40px;box-shadow:0 8px 24px rgba(47,47,47,0.08);">
            <tr>
              <td style="text-align:center;padding-bottom:24px;">
                <img src="https://parenthelper.co.uk/logo.png" alt="Parent Helper" width="120" height="32" style="display:block;margin:0 auto 12px;" />
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:16px;font-size:16px;line-height:1.6;">
                <p style="margin:0 0 16px;">Hi ${safeName},</p>
                <p style="margin:0 0 16px;">
                  Thank you for registering your classes with Parent Helper. Our onboarding team is reviewing your submission and will be in touch once everything is ready to go live.
                </p>
                <p style="margin:0 0 16px;font-weight:600;color:#4f6f52;">Here is what's coming next:</p>
                <ul style="margin:0 0 16px 20px;padding:0;font-size:15px;line-height:1.6;">
                  <li style="margin-bottom:10px;">Show up in local searches where parents are looking for activities</li>
                  <li style="margin-bottom:10px;">Receive and manage enquiries from one place</li>
                  <li style="margin-bottom:10px;">Access marketing tools to grow your classes</li>
                </ul>
                <p style="margin:0 0 24px;">
                  Ready to explore what comes next? <a href="https://parenthelper.co.uk/onboarding/premium" style="color:#4f6f52;text-decoration:none;font-weight:600;">Discover Parent Helper Premium</a> for more ways to stand out.
                </p>
                <p style="margin:0 0 8px;">Thank you for joining the Parent Helper community.</p>
                <p style="margin:0;">- The Parent Helper Team</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `Hi ${safeName},

Thank you for registering your classes with Parent Helper. Our onboarding team is reviewing your submission and will be in touch once everything is ready to go live.

Here is what's coming next:
- Show up in local searches where parents are looking for activities
- Receive and manage enquiries from one place
- Access marketing tools to grow your classes

Ready to explore what comes next? Discover Parent Helper Premium: https://parenthelper.co.uk/onboarding/premium

Thank you for joining the Parent Helper community.
- The Parent Helper Team`;

  return { html, text };
}


