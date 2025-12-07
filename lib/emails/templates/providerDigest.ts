type ProviderDigestTemplateParams = {
  providerName: string;
  weekStart: Date;
  weekEnd: Date;
  stats: {
    views: number;
    websiteClicks: number;
    phoneClicks: number;
    emailClicks: number;
    daysActive: number;
  };
  trendingLocations: Array<{ location: string; count: number }>;
  providerSlug: string | null;
};

const formatNumber = (value: number) => value.toLocaleString("en-GB");

export function getProviderDigestTemplate(params: ProviderDigestTemplateParams) {
  const { providerName, weekStart, weekEnd, stats, trendingLocations, providerSlug } = params;

  const weekStartLabel = weekStart.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const weekEndLabel = weekEnd.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  const totalClicks = stats.websiteClicks + stats.phoneClicks + stats.emailClicks;
  const supportEmail = process.env.SUPPORT_EMAIL || "hello@parenthelper.co.uk";
  const accountUrl = providerSlug
    ? `https://parenthelper.co.uk/providers/${providerSlug}`
    : "https://parenthelper.co.uk/providers";

  const trendingHtml = trendingLocations.length
    ? `<ul style="margin: 0; padding-left: 16px;">${trendingLocations
        .map(
          (item) =>
            `<li><strong>${item.location}</strong> – ${formatNumber(item.count)} searches</li>`,
        )
        .join("")}</ul>`
    : "<p>No standout towns this week — keep sharing your listings to boost visibility.</p>";

  const trendingText = trendingLocations.length
    ? trendingLocations
        .map((item) => `• ${item.location}: ${formatNumber(item.count)} searches`)
        .join("\n")
    : "• No standout towns this week — keep promoting your listings!";

  const subject = `Your Parent Helper weekly highlights (${weekStartLabel} – ${weekEndLabel})`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #3D3D3D; line-height: 1.6;">
      <h2 style="color: #9BAE82; margin-bottom: 4px;">Hi ${escapeHtml(providerName)},</h2>
      <p style="margin-top: 0;">
        Here's a summary of how families discovered your classes on Parent Helper last week
        (<strong>${weekStartLabel}</strong> – <strong>${weekEndLabel}</strong>).
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 8px; background: #F5F3F0; border: 1px solid #E7E5E0;">Metric</th>
            <th style="text-align: right; padding: 8px; background: #F5F3F0; border: 1px solid #E7E5E0;">Count</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; border: 1px solid #E7E5E0;">Class views</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #E7E5E0;">${formatNumber(
              stats.views,
            )}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #E7E5E0;">Website clicks</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #E7E5E0;">${formatNumber(
              stats.websiteClicks,
            )}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #E7E5E0;">Phone calls</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #E7E5E0;">${formatNumber(
              stats.phoneClicks,
            )}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #E7E5E0;">Email enquiries</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #E7E5E0;">${formatNumber(
              stats.emailClicks,
            )}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #E7E5E0;">Total contact actions</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #E7E5E0;"><strong>${formatNumber(
              totalClicks,
            )}</strong></td>
          </tr>
        </tbody>
      </table>

      <h3 style="margin-top: 24px; color: #9BAE82;">Trending towns families searched</h3>
      ${trendingHtml}

      <p style="margin-top: 24px;">
        Tip: keep your listings fresh with up-to-date descriptions and term dates to stay visible in search.
      </p>

      <p style="margin-top: 16px;">
        You can review and update your listing here:<br />
        <a href="${accountUrl}" style="color: #C97C5C;">${accountUrl}</a>
      </p>

      <p style="margin-top: 24px;">
        Need a hand? Reply to this email or contact us at
        <a href="mailto:${supportEmail}" style="color: #C97C5C;">${supportEmail}</a>.
      </p>

      <p style="margin-top: 24px;">Warmly,<br />The Parent Helper team</p>
    </div>
  `;

  const text = [
    `Hi ${providerName},`,
    "",
    `Here's how families discovered your classes last week (${weekStartLabel} – ${weekEndLabel}):`,
    `• Class views: ${formatNumber(stats.views)}`,
    `• Website clicks: ${formatNumber(stats.websiteClicks)}`,
    `• Phone calls: ${formatNumber(stats.phoneClicks)}`,
    `• Email enquiries: ${formatNumber(stats.emailClicks)}`,
    `• Total contact actions: ${formatNumber(totalClicks)}`,
    "",
    "Trending towns:",
    trendingText,
    "",
    `Update your listing: ${accountUrl}`,
    `Need support? ${supportEmail}`,
    "",
    "Warmly,",
    "The Parent Helper team",
  ].join("\n");

  return { subject, html, text };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (match) => {
    switch (match) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#039;";
      default:
        return match;
    }
  });
}

