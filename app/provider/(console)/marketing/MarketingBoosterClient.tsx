"use client";

import { useEffect, useState } from "react";
import { useProviderSession } from "../_components/ProviderContext";

type SeoScore = {
  score: number;
  issues: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    message: string;
    field?: string;
  }>;
  quick_fixes: Array<{
    action: string;
    description: string;
    impact: "low" | "medium" | "high";
  }>;
  keyword_opportunities: Array<{
    keyword: string;
    opportunityScore: number;
    reason: string;
  }>;
  breakdown: {
    title_quality: number;
    description_clarity: number;
    keyword_density: number;
    category_match: number;
    image_presence: number;
    local_keywords_match: number;
    review_data: number;
    ctr_score: number;
    field_completion: number;
  };
};

type AdAdvice = {
  platform: string;
  targeting: Record<string, unknown>;
  ad_copy: string;
  sample_headlines: string[];
  recommended_budget_cents: number | null;
  hashtags: string[];
  video_scripts: string[];
  posting_schedule: Record<string, unknown>;
};

export function MarketingBoosterClient() {
  const session = useProviderSession();
  const providerId = session?.provider?.id;

  const [seoScore, setSeoScore] = useState<SeoScore | null>(null);
  const [metaAds, setMetaAds] = useState<AdAdvice | null>(null);
  const [tiktokAds, setTiktokAds] = useState<AdAdvice | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    if (providerId) {
      loadData();
    }
  }, [providerId]);

  async function loadData() {
    if (!providerId) return;

    setLoading(true);
    try {
      // Load SEO score
      const seoResponse = await fetch(`/api/provider/seo-score?providerId=${providerId}`);
      if (seoResponse.ok) {
        const seoData = await seoResponse.json();
        setSeoScore(seoData);
      }

      // Load Meta ads advice
      const metaResponse = await fetch(
        `/api/provider/ads-advice?providerId=${providerId}&platform=meta`
      );
      if (metaResponse.ok) {
        const metaData = await metaResponse.json();
        setMetaAds(metaData);
      }

      // Load TikTok ads advice
      const tiktokResponse = await fetch(
        `/api/provider/ads-advice?providerId=${providerId}&platform=tiktok`
      );
      if (tiktokResponse.ok) {
        const tiktokData = await tiktokResponse.json();
        setTiktokAds(tiktokData);
      }
    } catch (error) {
      console.error("Error loading marketing data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function generateInsights(type: "seo" | "meta" | "tiktok") {
    if (!providerId) return;

    setGenerating(type);
    try {
      if (type === "seo") {
        const response = await fetch("/api/provider/seo-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ providerId, forceRefresh: true }),
        });
        if (response.ok) {
          const data = await response.json();
          setSeoScore(data);
        }
      } else {
        const platform = type === "meta" ? "meta" : "tiktok";
        const response = await fetch("/api/provider/ads-advice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ providerId, platform, forceRefresh: true }),
        });
        if (response.ok) {
          const data = await response.json();
          if (type === "meta") {
            setMetaAds(data);
          } else {
            setTiktokAds(data);
          }
        }
      }
    } catch (error) {
      console.error("Error generating insights:", error);
    } finally {
      setGenerating(null);
    }
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  }

  function getScoreBgColor(score: number): string {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center text-charcoal/70">Loading marketing insights...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-display-1 font-bold text-charcoal">Marketing Booster</h1>
        <p className="mt-2 text-body text-slateSoft">
          Get SEO insights and advertising advice to grow your class bookings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* SEO Score Card */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft">
          <div className="mb-4">
            <h2 className="text-title font-semibold text-charcoal">SEO Score</h2>
            <p className="text-small text-slateSoft">How discoverable you are</p>
          </div>

          {seoScore ? (
            <>
              <div className={`mb-4 flex h-24 w-24 items-center justify-center rounded-full ${getScoreBgColor(seoScore.score)}`}>
                <span className={`text-display-2 font-bold ${getScoreColor(seoScore.score)}`}>
                  {seoScore.score}
                </span>
              </div>

              <div className="mb-4 space-y-2">
                <h3 className="text-small font-medium text-charcoal">Top Issues:</h3>
                {seoScore.issues.slice(0, 3).map((issue, idx) => (
                  <div key={idx} className="text-small text-slateSoft">
                    <span className={`inline-block h-2 w-2 rounded-full mr-2 ${
                      issue.severity === "high" ? "bg-red-500" :
                      issue.severity === "medium" ? "bg-yellow-500" : "bg-blue-500"
                    }`} />
                    {issue.message}
                  </div>
                ))}
              </div>

              {seoScore.quick_fixes.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-small font-medium text-charcoal">Quick Fixes:</h3>
                  {seoScore.quick_fixes.slice(0, 2).map((fix, idx) => (
                    <button
                      key={idx}
                      className="mb-2 block w-full rounded-md border border-sage/50 bg-sage/10 px-3 py-2 text-left text-small text-charcoal transition hover:bg-sage/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                    >
                      {fix.description}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => generateInsights("seo")}
                disabled={generating === "seo"}
                className="w-full rounded-md bg-sage px-4 py-2 text-small font-medium text-white transition hover:bg-sage/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              >
                {generating === "seo" ? "Generating..." : "Generate New Insights"}
              </button>
            </>
          ) : (
            <div className="text-center" role="status">
              <h4 className="mb-2 text-small font-semibold text-charcoal">No SEO score yet</h4>
              <p className="mb-4 text-small text-charcoal/50">Generate SEO insights to see your score and recommendations.</p>
              <button
                onClick={() => generateInsights("seo")}
                disabled={generating === "seo"}
                className="w-full rounded-md bg-sage px-4 py-2 text-small font-medium text-white transition hover:bg-sage/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              >
                {generating === "seo" ? "Generating..." : "Generate SEO Score"}
              </button>
            </div>
          )}
        </div>

        {/* Meta Ads Card */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft">
          <div className="mb-4">
            <h2 className="text-title font-semibold text-charcoal">Meta Ads Starter Pack</h2>
            <p className="text-small text-slateSoft">Facebook & Instagram ads</p>
          </div>

          {metaAds ? (
            <>
              <div className="mb-4">
                <p className="mb-2 text-body text-charcoal">{metaAds.ad_copy}</p>
                {metaAds.recommended_budget_cents && (
                  <p className="text-small text-slateSoft">
                    Recommended budget: £{(metaAds.recommended_budget_cents / 100).toFixed(0)}/week
                  </p>
                )}
              </div>

              <div className="mb-4 space-y-2">
                <h3 className="text-small font-medium text-charcoal">Sample Headlines:</h3>
                {metaAds.sample_headlines.slice(0, 3).map((headline, idx) => (
                  <div key={idx} className="text-small text-slateSoft">
                    • {headline}
                  </div>
                ))}
              </div>

              {metaAds.hashtags.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-small font-medium text-charcoal">Hashtags:</h3>
                  <div className="flex flex-wrap gap-1">
                    {metaAds.hashtags.slice(0, 5).map((tag, idx) => (
                      <span key={idx} className="rounded bg-sage/10 px-2 py-1 text-small text-sage">
                        #{tag.replace("#", "")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => generateInsights("meta")}
                disabled={generating === "meta"}
                className="w-full rounded-md bg-sage px-4 py-2 text-small font-medium text-white transition hover:bg-sage/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              >
                {generating === "meta" ? "Generating..." : "Generate New Insights"}
              </button>
            </>
          ) : (
            <div className="text-center" role="status">
              <h4 className="mb-2 text-small font-semibold text-charcoal">No Meta ads advice yet</h4>
              <p className="mb-4 text-small text-charcoal/50">Generate Meta ads insights to get personalized recommendations.</p>
              <button
                onClick={() => generateInsights("meta")}
                disabled={generating === "meta"}
                className="w-full rounded-md bg-sage px-4 py-2 text-small font-medium text-white transition hover:bg-sage/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              >
                {generating === "meta" ? "Generating..." : "Generate Meta Ads Advice"}
              </button>
            </div>
          )}
        </div>

        {/* TikTok Card */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft">
          <div className="mb-4">
            <h2 className="text-title font-semibold text-charcoal">TikTok Creative Studio</h2>
            <p className="text-small text-slateSoft">Video content ideas</p>
          </div>

          {tiktokAds ? (
            <>
              <div className="mb-4">
                <p className="mb-2 text-body text-charcoal">{tiktokAds.ad_copy}</p>
                {tiktokAds.recommended_budget_cents && (
                  <p className="text-small text-slateSoft">
                    Recommended budget: £{(tiktokAds.recommended_budget_cents / 100).toFixed(0)}/week
                  </p>
                )}
              </div>

              {tiktokAds.video_scripts.length > 0 && (
                <div className="mb-4 space-y-2">
                  <h3 className="text-small font-medium text-charcoal">Video Script Ideas:</h3>
                  {tiktokAds.video_scripts.slice(0, 2).map((script, idx) => (
                    <div key={idx} className="rounded bg-cream/50 p-2 text-small text-slateSoft">
                      {script.substring(0, 100)}...
                    </div>
                  ))}
                </div>
              )}

              {tiktokAds.hashtags.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-small font-medium text-charcoal">Hashtags:</h3>
                  <div className="flex flex-wrap gap-1">
                    {tiktokAds.hashtags.slice(0, 5).map((tag, idx) => (
                      <span key={idx} className="rounded bg-sage/10 px-2 py-1 text-small text-sage">
                        #{tag.replace("#", "")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => generateInsights("tiktok")}
                disabled={generating === "tiktok"}
                className="w-full rounded-md bg-sage px-4 py-2 text-small font-medium text-white transition hover:bg-sage/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              >
                {generating === "tiktok" ? "Generating..." : "Generate New Insights"}
              </button>
            </>
          ) : (
            <div className="text-center" role="status">
              <h4 className="mb-2 text-small font-semibold text-charcoal">No TikTok advice yet</h4>
              <p className="mb-4 text-small text-charcoal/50">Generate TikTok insights to get personalized recommendations.</p>
              <button
                onClick={() => generateInsights("tiktok")}
                disabled={generating === "tiktok"}
                className="w-full rounded-md bg-sage px-4 py-2 text-small font-medium text-white transition hover:bg-sage/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              >
                {generating === "tiktok" ? "Generating..." : "Generate TikTok Advice"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

