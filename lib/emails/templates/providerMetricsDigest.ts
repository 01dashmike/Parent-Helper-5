export function getProviderMetricsDigestTemplate({
  providerName,
  weekStart,
  weekEnd,
  totalBookings,
  confirmedBookings,
  totalRevenue,
  revenueLastWeek,
  averageRating,
  reviewCount,
  newReviews,
  topClasses,
}: {
  providerName: string;
  weekStart: string;
  weekEnd: string;
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  revenueLastWeek: number;
  averageRating: number;
  reviewCount: number;
  newReviews: number;
  topClasses: Array<{ name: string; bookings: number; revenue: number }>;
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const subject = `Your Weekly Performance Summary - ${formatDate(weekStart)}`;

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
    <h1 style="color: #3D3D3D; margin-top: 0; font-size: 24px;">Weekly Performance Summary</h1>
    <p style="color: #3D3D3D; opacity: 0.7; margin-bottom: 24px;">
      ${formatDate(weekStart)} - ${formatDate(weekEnd)}
    </p>

    <div style="background-color: #F5F3F0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h2 style="color: #3D3D3D; font-size: 18px; margin-top: 0;">Hello ${providerName},</h2>
      <p style="color: #3D3D3D; margin-bottom: 0;">
        Here's your weekly performance summary. Keep up the great work!
      </p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
      <div style="background-color: #F5F3F0; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #9BAE82; margin: 0 0 8px 0;">Total Bookings</p>
        <p style="font-size: 32px; font-weight: 600; color: #3D3D3D; margin: 0;">${totalBookings}</p>
        <p style="font-size: 12px; color: #3D3D3D; opacity: 0.7; margin: 4px 0 0 0;">${confirmedBookings} confirmed</p>
      </div>
      <div style="background-color: #F5F3F0; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #9BAE82; margin: 0 0 8px 0;">Revenue This Week</p>
        <p style="font-size: 32px; font-weight: 600; color: #3D3D3D; margin: 0;">${formatCurrency(revenueLastWeek)}</p>
        <p style="font-size: 12px; color: #3D3D3D; opacity: 0.7; margin: 4px 0 0 0;">${formatCurrency(totalRevenue)} total</p>
      </div>
    </div>

    ${averageRating > 0 ? `
    <div style="background-color: #F5F3F0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #9BAE82; margin: 0 0 8px 0;">Average Rating</p>
      <p style="font-size: 24px; font-weight: 600; color: #3D3D3D; margin: 0;">
        ${averageRating.toFixed(1)} ⭐ (${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'})
      </p>
      ${newReviews > 0 ? `<p style="font-size: 12px; color: #3D3D3D; opacity: 0.7; margin: 4px 0 0 0;">${newReviews} new ${newReviews === 1 ? 'review' : 'reviews'} this week</p>` : ''}
    </div>
    ` : ''}

    ${topClasses.length > 0 ? `
    <div style="margin-bottom: 24px;">
      <h3 style="color: #3D3D3D; font-size: 16px; margin-bottom: 12px;">Top Performing Classes</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${topClasses.map((cls, idx) => `
        <tr style="border-bottom: 1px solid #9BAE8220;">
          <td style="padding: 12px 0; color: #3D3D3D; font-weight: 500;">${idx + 1}. ${cls.name}</td>
          <td style="padding: 12px 0; text-align: right; color: #3D3D3D; opacity: 0.7;">${cls.bookings} bookings</td>
          <td style="padding: 12px 0; text-align: right; color: #3D3D3D; font-weight: 600;">${formatCurrency(cls.revenue)}</td>
        </tr>
        `).join('')}
      </table>
    </div>
    ` : ''}

    <div style="border-top: 1px solid #9BAE8220; padding-top: 20px; margin-top: 24px;">
      <p style="color: #3D3D3D; opacity: 0.7; font-size: 14px; margin-bottom: 16px;">
        View detailed analytics and insights in your provider dashboard.
      </p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://parenthelper.co.uk'}/provider/analytics" 
         style="display: inline-block; background-color: #9BAE82; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
        View Full Analytics
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
Weekly Performance Summary
${formatDate(weekStart)} - ${formatDate(weekEnd)}

Hello ${providerName},

Here's your weekly performance summary:

Total Bookings: ${totalBookings} (${confirmedBookings} confirmed)
Revenue This Week: ${formatCurrency(revenueLastWeek)}
Total Revenue: ${formatCurrency(totalRevenue)}
${averageRating > 0 ? `Average Rating: ${averageRating.toFixed(1)} ⭐ (${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'})${newReviews > 0 ? `\n${newReviews} new ${newReviews === 1 ? 'review' : 'reviews'} this week` : ''}` : ''}

${topClasses.length > 0 ? `Top Performing Classes:\n${topClasses.map((cls, idx) => `${idx + 1}. ${cls.name} - ${cls.bookings} bookings - ${formatCurrency(cls.revenue)}`).join('\n')}` : ''}

View detailed analytics: ${process.env.NEXT_PUBLIC_APP_URL || 'https://parenthelper.co.uk'}/provider/analytics

This is an automated weekly summary from Parent Helper.
  `.trim();

  return { subject, html, text };
}

