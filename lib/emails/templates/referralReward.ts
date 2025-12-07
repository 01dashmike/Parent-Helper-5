export function referralReward({
    referrerName,
    referredProviderName,
    creditAmount,
    expiresAt,
}: {
    referrerName: string;
    referredProviderName: string;
    creditAmount: string;
    expiresAt: string | null;
}): { html: string; text: string } {
    const expiresText = expiresAt
        ? `Your credit expires on ${new Date(expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`
        : '';

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
                <p style="margin:0 0 16px;">Hi ${referrerName},</p>
                <p style="margin:0 0 16px;">
                  Great news! ${referredProviderName} just made their first paid Boost, which means you've earned a referral reward.
                </p>
                <div style="background-color:#4f6f52;color:#ffffff;padding:24px;border-radius:12px;text-align:center;margin:24px 0;">
                  <p style="margin:0 0 8px;font-size:14px;opacity:0.9;">Your Referral Credit</p>
                  <p style="margin:0;font-size:32px;font-weight:700;">£${creditAmount}</p>
                </div>
                <p style="margin:0 0 16px;">
                  This credit will automatically apply to your next Boost fees. ${expiresText}
                </p>
                <p style="margin:0 0 24px;text-align:center;">
                  <a href="https://parenthelper.co.uk/provider" style="display:inline-block;background-color:#4f6f52;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 32px;border-radius:24px;font-size:16px;">View Your Account</a>
                </p>
                <p style="margin:0 0 8px;font-size:14px;color:#666;">
                  Want to earn more credits? Share your referral link with other providers and help grow the Parent Helper community.
                </p>
                <p style="margin:0;font-size:14px;color:#666;">
                  Thank you for being part of Parent Helper!
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    const text = `Hi ${referrerName},

Great news! ${referredProviderName} just made their first paid Boost, which means you've earned a referral reward.

Your Referral Credit: £${creditAmount}

This credit will automatically apply to your next Boost fees. ${expiresText}

View your account: https://parenthelper.co.uk/provider

Want to earn more credits? Share your referral link with other providers and help grow the Parent Helper community.

Thank you for being part of Parent Helper!`;

    return { html, text };
}

