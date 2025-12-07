"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";

interface GrowthScoreData {
  growthScore: number;
  tier: "Bronze" | "Silver" | "Gold" | "None";
  multiplier: number;
  metrics: {
    profile_completion: number;
    listing_quality: number;
    booking_activity: number;
    reviews_score: number;
    referral_activity: number;
  };
  nextBestAction?: {
    title: string;
    explanation: string;
    estimatedImpact: string;
    suggestedDeadline: string;
    dashboardLink: string;
  };
}

interface GrowthScoreWidgetProps {
  providerId: number;
}

export default function GrowthScoreWidget({ providerId }: GrowthScoreWidgetProps) {
  const [data, setData] = useState<GrowthScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trend] = useState<"up" | "down" | "same">("same");

  useEffect(() => {
    let cancelled = false;

    async function fetchGrowthScore() {
      try {
        const response = await fetch(`/api/providers/growth-score?provider_id=${providerId}`);
        if (cancelled) return;
        
        if (response.ok) {
          const result = await response.json();
          if (!cancelled && result) {
            setData(result);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error fetching growth score:", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchGrowthScore();

    return () => {
      cancelled = true;
    };
  }, [providerId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-sage/30 bg-white p-6 shadow-sm">
        <div className="h-8 w-32 motion-safe:animate-pulse motion-reduce:animate-none rounded bg-gray-200" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-sage/30 bg-white p-6 shadow-sm text-center" role="status">
        <h3 className="text-sm font-semibold text-charcoal">No growth score data available yet</h3>
        <p className="mt-1 text-small text-charcoal/50">Your growth score will appear here once you have activity data.</p>
      </div>
    );
  }

  const tierColors = {
    Gold: { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-800", badge: "bg-yellow-100 text-yellow-800" },
    Silver: { bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-800", badge: "bg-gray-100 text-gray-800" },
    Bronze: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-800", badge: "bg-orange-100 text-orange-800" },
    None: { bg: "bg-white", border: "border-sage/30", text: "text-charcoal", badge: "bg-gray-100 text-gray-600" },
  };

  const safeMetrics = data.metrics || {
    profile_completion: 0,
    listing_quality: 0,
    booking_activity: 0,
    reviews_score: 0,
    referral_activity: 0,
  };

  const colors = tierColors[data.tier || "None"];

  return (
    <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-6 shadow-sm`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-charcoal">Growth Score</h3>
        {data.tier !== "None" && (
          <span className={`rounded-full px-3 py-1 text-small font-semibold ${colors.badge}`}>
            {data.tier} Tier
          </span>
        )}
      </div>

      {/* Score Dial */}
      <div className="mb-4 text-center">
        <div className={`text-5xl font-bold ${colors.text}`}>
          {(data.growthScore || 0).toFixed(0)}
          <span className="text-2xl text-charcoal/60">/100</span>
        </div>
        {(data.multiplier || 1) > 1.0 && (
          <div className="mt-2 text-sm font-medium text-green-700">
            Visibility Boost: +{Math.round(((data.multiplier || 1) - 1) * 100)}% exposure
          </div>
        )}
      </div>

      {/* Trend Indicator */}
      {trend !== "same" && (
        <div className="mb-4 flex items-center justify-center gap-2 text-sm">
          {trend === "up" ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
          <span className={trend === "up" ? "text-green-600" : "text-red-600"}>
            {trend === "up" ? "Up from last week" : "Down from last week"}
          </span>
        </div>
      )}

      {/* Component Breakdown */}
      <div className="mb-4 space-y-2">
        <div className="text-small font-medium text-charcoal/70">Score Breakdown:</div>
        <div className="space-y-1">
          <ScoreBar label="Profile" value={safeMetrics.profile_completion} weight={0.1} />
          <ScoreBar label="Listings" value={safeMetrics.listing_quality} weight={0.2} />
          <ScoreBar label="Bookings" value={safeMetrics.booking_activity} weight={0.3} />
          <ScoreBar label="Reviews" value={safeMetrics.reviews_score} weight={0.2} />
          <ScoreBar label="Referrals" value={safeMetrics.referral_activity} weight={0.2} />
        </div>
      </div>

      {/* Next Best Action */}
      {data.nextBestAction && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
          <div className="mb-2 text-sm font-semibold text-yellow-900">✨ Next Best Action</div>
          <div className="mb-2 text-sm font-medium text-yellow-800">{data.nextBestAction.title}</div>
          <div className="mb-3 text-small text-yellow-700">{data.nextBestAction.explanation}</div>
          <Link
            href={data.nextBestAction.dashboardLink}
            className="inline-block rounded-md bg-yellow-600 px-3 py-1.5 text-small font-semibold text-white transition hover:bg-yellow-700"
          >
            Take Action →
          </Link>
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value, weight }: { label: string; value: number; weight: number }) {
  const contribution = value * weight;
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 text-small text-charcoal/70">{label}:</div>
      <div className="flex-1">
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-sage transition-all"
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
      <div className="w-12 text-right text-small font-medium text-charcoal">
        {contribution.toFixed(1)}
      </div>
    </div>
  );
}

