/**
 * Email template for weekly marketing summary
 * Subject: "Your Marketing Boost: SEO & Ads Insights"
 */

export function getProviderMarketingSummaryTemplate({
  providerName,
  seoScore,
  seoScoreTrend,
  newKeywordOpportunities,
  topFix,
  adsIdea,
  dashboardUrl,
}: {
  providerName: string;
  seoScore: number;
  seoScoreTrend: { current: number; previous: number } | null;
  newKeywordOpportunities: Array<{ keyword: string; opportunityScore: number }>;
  topFix: string | null;
  adsIdea: string | null;
  dashboardUrl: string;
}) {
  const subject = "Your Marketing Boost: SEO & Ads Insights";

  const trendArrow = seoScoreTrend
    ? seoScoreTrend.current > seoScoreTrend.previous
      ? "↑"
      : seoScoreTrend.current < seoScoreTrend.previous
        ? "↓"
        : "→"
    : "";

  const trendText = seoScoreTrend
    ? seoScoreTrend.current > seoScoreTrend.previous
      ? `Up ${seoScoreTrend.current - seoScoreTrend.previous} points!`
      : seoScoreTrend.current < seoScoreTrend.previous
        ? `Down ${seoScoreTrend.previous - seoScoreTrend.current} points`
        : "No change"
    : "";

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
    <h1 style="color: #3D3D3D; margin-top: 0; font-size: 24px;">Your Marketing Boost</h1>
    <p style="color: #3D3D3D; opacity: 0.7; margin-bottom: 24px;">
      Hello ${providerName},
    </p>

    <div style="background-color: #F5F3F0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h2 style="color: #3D3D3D; font-size: 18px; margin-top: 0; margin-bottom: 16px;">SEO Score</h2>
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="font-size: 48px; font-weight: 600; color: ${seoScore >= 80 ? "#10B981" : seoScore >= 60 ? "#F59E0B" : "#EF4444"};">
          ${seoScore}
        </div>
        ${trendText ? `<p style="color: #3D3D3D; opacity: 0.7; margin-top: 8px;">${trendArrow} ${trendText}</p>` : ""}
      </div>
    </div>

    ${newKeywordOpportunities.length > 0 ? `
    <div style="background-color: #F5F3F0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h2 style="color: #3D3D3D; font-size: 18px; margin-top: 0; margin-bottom: 16px;">New Keyword Opportunities</h2>
      <ul style="margin: 0; padding-left: 20px;">
        ${newKeywordOpportunities.slice(0, 3).map(
          (kw) => `<li style="margin-bottom: 8px; color: #3D3D3D;">${kw.keyword} <span style="opacity: 0.7;">(${kw.opportunityScore}% opportunity)</span></li>`
        ).join("")}
      </ul>
    </div>
    ` : ""}

    ${topFix ? `
    <div style="background-color: #F5F3F0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h2 style="color: #3D3D3D; font-size: 18px; margin-top: 0; margin-bottom: 16px;">Top Fix for This Week</h2>
      <p style="color: #3D3D3D; margin: 0;">${topFix}</p>
    </div>
    ` : ""}

    ${adsIdea ? `
    <div style="background-color: #F5F3F0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h2 style="color: #3D3D3D; font-size: 18px; margin-top: 0; margin-bottom: 16px;">Ads Idea of the Week</h2>
      <p style="color: #3D3D3D; margin: 0;">${adsIdea}</p>
    </div>
    ` : ""}

    <div style="border-top: 1px solid #9BAE8220; padding-top: 20px; margin-top: 24px; text-align: center;">
      <p style="color: #3D3D3D; opacity: 0.7; font-size: 14px; margin-bottom: 16px;">
        Get more insights and actionable tips
      </p>
      <a href="${dashboardUrl}" 
         style="display: inline-block; background-color: #9BAE82; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
        Open Your Marketing Dashboard →
      </a>
    </div>

    <p style="color: #3D3D3D; opacity: 0.5; font-size: 12px; margin-top: 32px; margin-bottom: 0;">
      This is an automated weekly marketing summary from Parent Helper.
    </p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Your Marketing Boost: SEO & Ads Insights

Hello ${providerName},

SEO Score: ${seoScore}${trendText ? ` ${trendArrow} ${trendText}` : ""}

${newKeywordOpportunities.length > 0 ? `
New Keyword Opportunities:
${newKeywordOpportunities.slice(0, 3).map((kw) => `- ${kw.keyword} (${kw.opportunityScore}% opportunity)`).join("\n")}
` : ""}

${topFix ? `Top Fix for This Week: ${topFix}\n` : ""}

${adsIdea ? `Ads Idea of the Week: ${adsIdea}\n` : ""}

Get more insights: ${dashboardUrl}

This is an automated weekly marketing summary from Parent Helper.
  `.trim();

  return { subject, html, text };
}

