"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getGrowthScoreLabel } from "@/lib/analytics/providerGrowthScore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface GrowthScoreCardProps {
  score: number;
  factors: {
    bookings: number;
    revenue: number;
    engagement: number;
    quality: number;
  };
  breakdown: {
    bookingsScore: number;
    revenueScore: number;
    engagementScore: number;
    qualityScore: number;
  };
  previousScore?: number;
}

export function GrowthScoreCard({
  score,
  factors: _factors,
  breakdown,
  previousScore,
}: GrowthScoreCardProps) {
  const { label, color, description } = getGrowthScoreLabel(score);
  const trend = previousScore ? score - previousScore : 0;
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider Growth Score</CardTitle>
        <CardDescription>
          A composite metric measuring your overall performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Score */}
        <div className="text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className={`text-display-1 font-bold ${color}`}>{score}</span>
            <span className="text-title text-slateSoft">/100</span>
          </div>
          <p className={`text-title font-semibold ${color}`}>{label}</p>
          <p className="text-small text-slateSoft">{description}</p>
          {previousScore && (
            <div className="mt-2 flex items-center justify-center gap-1 text-small">
              <TrendIcon className={`h-4 w-4 ${trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-slateSoft"}`} />
              <span className={trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-slateSoft"}>
                {trend > 0 ? "+" : ""}{trend} from last week
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <Progress value={score} className="h-3" />

        {/* Breakdown */}
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex justify-between text-small">
              <span className="text-slateSoft">Bookings</span>
              <span className="font-medium text-charcoal">{breakdown.bookingsScore}/25</span>
            </div>
            <Progress value={(breakdown.bookingsScore / 25) * 100} className="h-2" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-small">
              <span className="text-slateSoft">Revenue</span>
              <span className="font-medium text-charcoal">{breakdown.revenueScore}/25</span>
            </div>
            <Progress value={(breakdown.revenueScore / 25) * 100} className="h-2" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-small">
              <span className="text-slateSoft">Engagement</span>
              <span className="font-medium text-charcoal">{breakdown.engagementScore}/25</span>
            </div>
            <Progress value={(breakdown.engagementScore / 25) * 100} className="h-2" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-small">
              <span className="text-slateSoft">Quality</span>
              <span className="font-medium text-charcoal">{breakdown.qualityScore}/25</span>
            </div>
            <Progress value={(breakdown.qualityScore / 25) * 100} className="h-2" />
          </div>
        </div>

        {/* Explanation */}
        <div className="rounded-lg border border-sage/20 bg-cream/50 p-4">
          <p className="text-small text-slateSoft">
            <strong>How it works:</strong> Your Growth Score combines bookings, revenue, customer engagement, and service quality into a single metric. Higher scores indicate better performance and growth potential.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

