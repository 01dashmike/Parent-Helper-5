"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";

import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion/tokens";
import { Copy, Share2, TrendingUp, Users, FileText, CheckCircle, Gift } from "lucide-react";
import { getCampaign } from "@/lib/referrals/campaigns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReferralsDashboardSkeleton } from "./ReferralsDashboardSkeleton";
import { formatDateDefault } from "@/lib/utils/date";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

type ReferralData = {
  referral_code: string | null;
  referral_url: string | null;
  campaignId?: string; // Optional campaign ID
  analytics: {
    clicks: number;
    registrations: number;
    listings_created: number;
    conversions: number;
  };
  rewards: Array<{
    id: string;
    reward_type: string;
    reward_value: number;
    reason: string;
    expires_at: string | null;
  }>;
};

const ReferralsDashboard = memo(function ReferralsDashboard() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/api/provider/referrals");
      if (!response.ok) throw new Error("Failed to fetch");
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error("[ReferralsDashboard] Unexpected error:", error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Reason: callback should remain stable and not recreate on every render
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleGenerateCode() {
    if (!data) return;
    
    setGenerating(true);
    try {
      // We need provider_id - for now, we'll call the API endpoint that generates it
      const generateResponse = await fetch("/api/provider/referrals/generate", {
        method: "POST",
      });
      
      if (generateResponse.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("[ReferralsDashboard] Unexpected error:", error);
    } finally {
      setGenerating(false);
    }
  }

  function handleCopyUrl() {
    if (!data?.referral_url) return;
    navigator.clipboard.writeText(data.referral_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShare() {
    if (!data?.referral_url) return;
    
    if (navigator.share) {
      navigator.share({
        title: "Join Parent Helper",
        text: "Check out Parent Helper - a platform for baby and toddler classes!",
        url: data.referral_url,
      });
    } else {
      handleCopyUrl();
    }
  }

  // Ensure all analytics counts are numbers with defaults - memoize to avoid recalculation (before early return)
  const analytics = useMemo(() => ({
    clicks: Number(data?.analytics?.clicks) || 0,
    registrations: Number(data?.analytics?.registrations) || 0,
    listings_created: Number(data?.analytics?.listings_created) || 0,
    conversions: Number(data?.analytics?.conversions) || 0,
  }), [data?.analytics]);

  const funnelSteps = useMemo(() => [
    { label: "Clicks", value: analytics.clicks, color: "bg-blue-500" },
    { label: "Registrations", value: analytics.registrations, color: "bg-purple-500" },
    { label: "Listings", value: analytics.listings_created, color: "bg-orange-500" },
    { label: "Bookings", value: analytics.conversions, color: "bg-green-500" },
  ], [analytics]);

  const maxValue = useMemo(() => 
    Math.max(...funnelSteps.map((s) => s.value), 1),
    [funnelSteps]
  );

  if (loading) {
    return <ReferralsDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Referrals & Rewards</CardTitle>
          <CardDescription>
            Share your referral link to earn free boosts and credits
            {data?.campaignId && data.campaignId !== "default" && (
              <span className="ml-2 text-xs text-slateSoft">
                (Campaign: {getCampaign(data.campaignId).name})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Referral Link Section */}
          <div className="space-y-4">
            {!data?.referral_code ? (
              <div className="rounded-lg border border-sage/30 bg-cream/50 p-4 text-center">
                <p className="mb-4 text-small text-slateSoft">
                  Generate your unique referral link to start earning rewards
                </p>
                <Button onClick={handleGenerateCode} disabled={generating}>
                  {generating ? "Generating..." : "Generate Referral Link"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <VisuallyHidden as="label" htmlFor="referral-url">
                    Your referral URL
                  </VisuallyHidden>
                  <input
                    id="referral-url"
                    type="text"
                    readOnly
                    value={data.referral_url || ""}
                    className="flex-1 rounded-md border border-sage/30 bg-white px-3 py-2 text-small"
                    aria-label="Your referral URL"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyUrl}
                    className="flex items-center gap-2"
                    aria-label={copied ? "Referral URL copied to clipboard" : "Copy referral URL to clipboard"}
                  >
                    <Copy className="h-4 w-4" width={16} height={16} aria-hidden="true" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleShare}
                    className="flex items-center gap-2"
                    aria-label="Share referral link"
                  >
                    <Share2 className="h-4 w-4" width={16} height={16} aria-hidden="true" />
                    Share
                  </Button>
                </div>
                <p className="text-small text-slateSoft">
                  Share this link with other providers. When they register and complete their first booking, you&apos;ll earn a reward!
                </p>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-sage/20 bg-white p-4">
              <div className="flex items-center gap-2 text-slateSoft">
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
                <span className="text-small">Clicks</span>
              </div>
              <p className="mt-1 text-title font-bold text-charcoal">{analytics.clicks}</p>
            </div>
            <div className="rounded-lg border border-sage/20 bg-white p-4">
              <div className="flex items-center gap-2 text-slateSoft">
                <Users className="h-4 w-4" aria-hidden="true" />
                <span className="text-small">Registrations</span>
              </div>
              <p className="mt-1 text-title font-bold text-charcoal">{analytics.registrations}</p>
            </div>
            <div className="rounded-lg border border-sage/20 bg-white p-4">
              <div className="flex items-center gap-2 text-slateSoft">
                <FileText className="h-4 w-4" aria-hidden="true" />
                <span className="text-small">Listings</span>
              </div>
              <p className="mt-1 text-title font-bold text-charcoal">{analytics.listings_created}</p>
            </div>
            <div className="rounded-lg border border-sage/20 bg-white p-4">
              <div className="flex items-center gap-2 text-slateSoft">
                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                <span className="text-small">Bookings</span>
              </div>
              <p className="mt-1 text-title font-bold text-charcoal">{analytics.conversions}</p>
            </div>
          </div>

          {/* Funnel Chart */}
          <div className="space-y-2">
            <h3 className="text-small font-semibold text-charcoal">Conversion Funnel</h3>
            <div className="space-y-2">
              {funnelSteps.map((step, index) => (
                <div key={step.label} className="space-y-1">
                  <div className="flex items-center justify-between text-small">
                    <span className="text-slateSoft">{step.label}</span>
                    <span className="font-medium text-charcoal">{step.value}</span>
                  </div>
                  <div className="h-6 overflow-hidden rounded-full bg-cream">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(step.value / maxValue) * 100}%` }}
                      transition={{ duration: motionTokens.slow, delay: index * 0.1 }}
                      className={cn("h-full", step.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rewards Section */}
          {data?.rewards && data.rewards.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-small font-semibold text-charcoal">Your Rewards</h3>
              <div className="space-y-2">
                {data.rewards.map((reward) => {
                  const rewardText =
                    reward.reward_type === "free_boost"
                      ? `${reward.reward_value} Free Boost${reward.reward_value > 1 ? "s" : ""}`
                      : reward.reward_type === "credit"
                        ? `£${(reward.reward_value / 100).toFixed(2)} Credit`
                        : `${reward.reward_value}% Discount`;

                  return (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between rounded-lg border border-sage/20 bg-cream/50 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-sage" />
                        <div>
                          <p className="text-small font-medium text-charcoal">{rewardText}</p>
                          <p className="text-small text-slateSoft">{reward.reason}</p>
                        </div>
                      </div>
                      {reward.expires_at && (
                        <p className="text-small text-slateSoft">
                          Expires {formatDateDefault(reward.expires_at)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

ReferralsDashboard.displayName = "ReferralsDashboard";

export default ReferralsDashboard;

