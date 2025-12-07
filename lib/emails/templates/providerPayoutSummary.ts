export function getProviderPayoutSummaryTemplate({
  providerName,
  monthStart,
  monthEnd,
  totalGross,
  totalFees,
  totalNet,
  payoutCount,
  payouts,
}: {
  providerName: string;
  monthStart: string;
  monthEnd: string;
  totalGross: number;
  totalFees: number;
  totalNet: number;
  payoutCount: number;
  payouts: Array<{
    id: string;
    amount: number;
    currency: string;
    arrival_date: number;
    status: string;
    bookingCount: number;
  }>;
}) {
  const formatCurrency = (amountCents: number, currency: string = "gbp") => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountCents / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
    })} - ${endDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`;
  };

  const subject = `Monthly Payout Summary - ${formatDateRange(monthStart, monthEnd)}`;

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
    <h1 style="color: #3D3D3D; margin-top: 0; font-size: 24px;">Monthly Payout Summary</h1>
    <p style="color: #3D3D3D; opacity: 0.7; margin-bottom: 24px;">
      ${formatDateRange(monthStart, monthEnd)}
    </p>

    <div style="background-color: #F5F3F0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h2 style="color: #3D3D3D; font-size: 18px; margin-top: 0;">Hello ${providerName},</h2>
      <p style="color: #3D3D3D; margin-bottom: 0;">
        Here's your monthly payout reconciliation summary for the period above.
      </p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
      <div style="background-color: #F5F3F0; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #9BAE82; margin: 0 0 8px 0;">Total Gross</p>
        <p style="font-size: 28px; font-weight: 600; color: #3D3D3D; margin: 0;">${formatCurrency(totalGross)}</p>
      </div>
      <div style="background-color: #F5F3F0; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #9BAE82; margin: 0 0 8px 0;">Total Fees</p>
        <p style="font-size: 28px; font-weight: 600; color: #3D3D3D; margin: 0;">${formatCurrency(totalFees)}</p>
      </div>
    </div>

    <div style="background-color: #9BAE82; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: white; opacity: 0.9; margin: 0 0 8px 0;">Net Payout</p>
      <p style="font-size: 36px; font-weight: 600; color: white; margin: 0;">${formatCurrency(totalNet)}</p>
      <p style="font-size: 12px; color: white; opacity: 0.9; margin: 4px 0 0 0;">${payoutCount} ${payoutCount === 1 ? 'payout' : 'payouts'}</p>
    </div>

    ${payouts.length > 0 ? `
    <div style="margin-bottom: 24px;">
      <h3 style="color: #3D3D3D; font-size: 16px; margin-bottom: 12px;">Payout Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #9BAE82;">
            <th style="padding: 12px 0; text-align: left; color: #3D3D3D; font-weight: 600; font-size: 12px; text-transform: uppercase;">Payout ID</th>
            <th style="padding: 12px 0; text-align: right; color: #3D3D3D; font-weight: 600; font-size: 12px; text-transform: uppercase;">Amount</th>
            <th style="padding: 12px 0; text-align: center; color: #3D3D3D; font-weight: 600; font-size: 12px; text-transform: uppercase;">Arrival</th>
            <th style="padding: 12px 0; text-align: center; color: #3D3D3D; font-weight: 600; font-size: 12px; text-transform: uppercase;">Bookings</th>
          </tr>
        </thead>
        <tbody>
          ${payouts.map((payout) => `
          <tr style="border-bottom: 1px solid #9BAE8220;">
            <td style="padding: 12px 0; color: #3D3D3D; font-size: 12px; font-family: monospace;">${payout.id.slice(-8)}</td>
            <td style="padding: 12px 0; text-align: right; color: #3D3D3D; font-weight: 600;">${formatCurrency(payout.amount, payout.currency)}</td>
            <td style="padding: 12px 0; text-align: center; color: #3D3D3D; opacity: 0.7; font-size: 12px;">${formatDate(payout.arrival_date)}</td>
            <td style="padding: 12px 0; text-align: center; color: #3D3D3D; opacity: 0.7;">${payout.bookingCount}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div style="border-top: 1px solid #9BAE8220; padding-top: 20px; margin-top: 24px;">
      <p style="color: #3D3D3D; opacity: 0.7; font-size: 14px; margin-bottom: 16px;">
        View detailed payout reconciliation and download CSV exports in your provider dashboard.
      </p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://parenthelper.co.uk'}/provider/payouts" 
         style="display: inline-block; background-color: #9BAE82; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
        View Payout Dashboard
      </a>
    </div>

    <p style="color: #3D3D3D; opacity: 0.5; font-size: 12px; margin-top: 32px; margin-bottom: 0;">
      This is an automated monthly payout summary from Parent Helper.
    </p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Monthly Payout Summary
${formatDateRange(monthStart, monthEnd)}

Hello ${providerName},

Here's your monthly payout reconciliation summary:

Total Gross: ${formatCurrency(totalGross)}
Total Fees: ${formatCurrency(totalFees)}
Net Payout: ${formatCurrency(totalNet)} (${payoutCount} ${payoutCount === 1 ? 'payout' : 'payouts'})

${payouts.length > 0 ? `Payout Details:\n${payouts.map((p) => `- ${p.id.slice(-8)}: ${formatCurrency(p.amount, p.currency)} (Arrival: ${formatDate(p.arrival_date)}, ${p.bookingCount} bookings)`).join('\n')}` : ''}

View detailed payout reconciliation: ${process.env.NEXT_PUBLIC_APP_URL || 'https://parenthelper.co.uk'}/provider/payouts

This is an automated monthly payout summary from Parent Helper.
  `.trim();

  return { subject, html, text };
}

