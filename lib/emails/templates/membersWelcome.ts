export function membersWelcome(name: string, dashboardUrl: string): {
  html: string;
  text: string;
  subject: string;
} {
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
                  Welcome to Parent Helper Members! We're excited to have you join our community.
                </p>
                <p style="margin:0 0 16px;font-weight:600;color:#4f6f52;">Here's what you can do:</p>
                <ul style="margin:0 0 16px 20px;padding:0;font-size:15px;line-height:1.6;">
                  <li style="margin-bottom:10px;">Save searches and get alerts when new classes match your criteria</li>
                  <li style="margin-bottom:10px;">Save meal plans, exercise routines, and wellness guides</li>
                  <li style="margin-bottom:10px;">Track your bookings and manage everything in one place</li>
                </ul>
                <p style="margin:0 0 24px;text-align:center;">
                  <a href="${dashboardUrl}" style="display:inline-block;background-color:#4f6f52;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Go to Your Dashboard</a>
                </p>
                <p style="margin:0 0 8px;">Happy exploring!</p>
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

Welcome to Parent Helper Members! We're excited to have you join our community.

Here's what you can do:
- Save searches and get alerts when new classes match your criteria
- Save meal plans, exercise routines, and wellness guides
- Track your bookings and manage everything in one place

Go to Your Dashboard: ${dashboardUrl}

Happy exploring!
- The Parent Helper Team`;

  return {
    html,
    text,
    subject: "Welcome to Parent Helper Members",
  };
}

