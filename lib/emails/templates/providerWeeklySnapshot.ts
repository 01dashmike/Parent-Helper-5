/**
 * Email template for weekly provider snapshot
 * Subject: "Your Parent Helper Week at a Glance"
 */

export function getProviderWeeklySnapshotTemplate({
  providerName,
  totalRevenue,
  totalBookings,
  avgRating,
  walletTopupsFromReferrals,
  upcomingClassesCount,
  dashboardUrl,
}: {
  providerName: string;
  totalRevenue: number;
  totalBookings: number;
  avgRating: number;
  walletTopupsFromReferrals: number;
  upcomingClassesCount: number;
  dashboardUrl: string;
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const subject = "Your Parent Helper Week at a Glance";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #3D3D3D; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F5F3F0;">
  <div style="background-color: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="color: #3D3D3D; margin-top: 0; font-size: 24px;">Your Week at a Glance</h1>
    <p style="color: #3D3D3D; opacity: 0.7; margin-bottom: 24px;">
      Hello ${providerName},
    </p>

    <div style="background-color: #F5F3F0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h2 style="color: #3D3D3D; font-size: 18px; margin-top: 0; margin-bottom: 16px;">This Week's Highlights</h2>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
        <div style="background-color: white; border-radius: 8px; padding: 16px; text-align: center;">
          <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #9BAE82; margin: 0 0 8px 0;">Revenue</p>
          <p style="font-size: 28px; font-weight: 600; color: #3D3D3D; margin: 0;">${formatCurrency(totalRevenue)}</p>
        </div>
        <div style="background-color: white; border-radius: 8px; padding: 16px; text-align: center;">
          <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #9BAE82; margin: 0 0 8px 0;">New Bookings</p>
          <p style="font-size: 28px; font-weight: 600; color: #3D3D3D; margin: 0;">${totalBookings}</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div style="background-color: white; border-radius: 8px; padding: 16px; text-align: center;">
          <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #9BAE82; margin: 0 0 8px 0;">Avg Rating</p>
          <p style="font-size: 28px; font-weight: 600; color: #3D3D3D; margin: 0;">${avgRating > 0 ? `${avgRating.toFixed(1)}★` : "N/A"}</p>
        </div>
        <div style="background-color: white; border-radius: 8px; padding: 16px; text-align: center;">
          <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #9BAE82; margin: 0 0 8px 0;">Referrals</p>
          <p style="font-size: 28px; font-weight: 600; color: #3D3D3D; margin: 0;">${formatCurrency(walletTopupsFromReferrals)}</p>
        </div>
      </div>
    </div>

    <div style="background-color: #F5F3F0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="font-size: 14px; color: #3D3D3D; margin: 0 0 8px 0;">
        <strong>Next Classes:</strong> ${upcomingClassesCount} ${upcomingClassesCount === 1 ? "class" : "classes"} scheduled this week
      </p>
    </div>

    <div style="border-top: 1px solid #9BAE8220; padding-top: 20px; margin-top: 24px; text-align: center;">
      <p style="color: #3D3D3D; opacity: 0.7; font-size: 14px; margin-bottom: 16px;">
        Boost your classes for the week ahead
      </p>
      <a href="${dashboardUrl}" 
         style="display: inline-block; background-color: #9BAE82; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
        View Dashboard →
      </a>
    </div>

    <p style="color: #3D3D3D; opacity: 0.5; font-size: 12px; margin-top: 32px; margin-bottom: 0;">
      This is an automated weekly summary from Parent Helper.
    </p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Your Parent Helper Week at a Glance

Hello ${providerName},

This Week's Highlights:

Revenue: ${formatCurrency(totalRevenue)}
New Bookings: ${totalBookings}
Avg Rating: ${avgRating > 0 ? `${avgRating.toFixed(1)}★` : "N/A"}
Referrals: ${formatCurrency(walletTopupsFromReferrals)}
Next Classes: ${upcomingClassesCount} ${upcomingClassesCount === 1 ? "class" : "classes"} scheduled this week

Boost your classes for the week ahead → ${dashboardUrl}

This is an automated weekly summary from Parent Helper.
  `.trim();

  return { subject, html, text };
}

