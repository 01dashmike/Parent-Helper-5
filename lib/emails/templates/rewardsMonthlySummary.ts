/**
 * Email template for monthly rewards summary
 * Subject: "Your Parent Helper Rewards Summary - [Month]"
 */

export function getRewardsMonthlySummaryTemplate({
  userName,
  monthName,
  rewardsEarnedCents,
  rewardsRedeemedCents,
  rewardsExpiringSoonCents,
  totalAvailableCents,
  rewardsEarnedCount,
  rewardsRedeemedCount,
  rewardsExpiringCount,
  rewardsUrl,
}: {
  userName: string;
  monthName: string;
  rewardsEarnedCents: number;
  rewardsRedeemedCents: number;
  rewardsExpiringSoonCents: number;
  totalAvailableCents: number;
  rewardsEarnedCount: number;
  rewardsRedeemedCount: number;
  rewardsExpiringCount: number;
  rewardsUrl: string;
}) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  };

  const subject = `Your Parent Helper Rewards Summary - ${monthName}`;

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
                <p style="margin:0 0 16px;">Hi ${userName},</p>
                <p style="margin:0 0 24px;">
                  Here's your rewards summary for ${monthName}:
                </p>
                
                <div style="background-color:#4f6f52;color:#ffffff;padding:24px;border-radius:12px;text-align:center;margin:24px 0;">
                  <p style="margin:0 0 8px;font-size:14px;opacity:0.9;">Total Available Credit</p>
                  <p style="margin:0;font-size:32px;font-weight:700;">${formatCurrency(totalAvailableCents)}</p>
                </div>

                <div style="background-color:#f5f5f0;border-radius:8px;padding:20px;margin-bottom:16px;">
                  <h3 style="margin:0 0 16px;font-size:18px;color:#2f2f2f;">Rewards Earned This Month</h3>
                  <p style="margin:0;font-size:24px;font-weight:600;color:#4f6f52;">${formatCurrency(rewardsEarnedCents)}</p>
                  <p style="margin:8px 0 0;font-size:14px;color:#666;">${rewardsEarnedCount} ${rewardsEarnedCount === 1 ? "reward" : "rewards"}</p>
                </div>

                <div style="background-color:#f5f5f0;border-radius:8px;padding:20px;margin-bottom:16px;">
                  <h3 style="margin:0 0 16px;font-size:18px;color:#2f2f2f;">Rewards Redeemed</h3>
                  <p style="margin:0;font-size:24px;font-weight:600;color:#2f2f2f;">${formatCurrency(rewardsRedeemedCents)}</p>
                  <p style="margin:8px 0 0;font-size:14px;color:#666;">${rewardsRedeemedCount} ${rewardsRedeemedCount === 1 ? "reward" : "rewards"}</p>
                </div>

                ${rewardsExpiringSoonCents > 0 ? `
                <div style="background-color:#fff3cd;border:2px solid #ffc107;border-radius:8px;padding:20px;margin-bottom:16px;">
                  <h3 style="margin:0 0 16px;font-size:18px;color:#856404;">Rewards Expiring Soon</h3>
                  <p style="margin:0;font-size:24px;font-weight:600;color:#856404;">${formatCurrency(rewardsExpiringSoonCents)}</p>
                  <p style="margin:8px 0 0;font-size:14px;color:#856404;">${rewardsExpiringCount} ${rewardsExpiringCount === 1 ? "reward" : "rewards"} expiring in the next 30 days</p>
                  <p style="margin:16px 0 0;font-size:14px;color:#856404;">Don't let your credits go to waste!</p>
                </div>
                ` : ""}

                <p style="margin:24px 0;text-align:center;">
                  <a href="${rewardsUrl}" style="display:inline-block;background-color:#4f6f52;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 32px;border-radius:24px;font-size:16px;">View Your Rewards</a>
                </p>
                
                <p style="margin:24px 0 8px;font-size:14px;color:#666;">
                  Thank you for being part of Parent Helper!
                </p>
                <p style="margin:0;font-size:14px;color:#666;">
                  Best regards,<br>The Parent Helper Team
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `Hi ${userName},

Here's your rewards summary for ${monthName}:

Total Available Credit: ${formatCurrency(totalAvailableCents)}

Rewards Earned This Month: ${formatCurrency(rewardsEarnedCents)} (${rewardsEarnedCount} ${rewardsEarnedCount === 1 ? "reward" : "rewards"})

Rewards Redeemed: ${formatCurrency(rewardsRedeemedCents)} (${rewardsRedeemedCount} ${rewardsRedeemedCount === 1 ? "reward" : "rewards"})

${rewardsExpiringSoonCents > 0 ? `Rewards Expiring Soon: ${formatCurrency(rewardsExpiringSoonCents)} (${rewardsExpiringCount} ${rewardsExpiringCount === 1 ? "reward" : "rewards"} expiring in the next 30 days)\n\nDon't let your credits go to waste!\n\n` : ""}View your rewards: ${rewardsUrl}

Thank you for being part of Parent Helper!

Best regards,
The Parent Helper Team`;

  return { subject, html, text };
}

