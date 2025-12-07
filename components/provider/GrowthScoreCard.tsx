"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

interface GrowthScoreCardProps {
  currentScore: number;
  previousScore?: number;
  breakdown?: {
    bookingGrowth: number;
    conversionRate: number;
    profileCompleteness: number;
    reviewAverage: number;
  };
  nextBestAction?: string;
}

const GrowthScoreCard = memo(function GrowthScoreCard({
  currentScore,
  previousScore,
  breakdown,
  nextBestAction,
}: GrowthScoreCardProps) {
  const scoreColor = useMemo(() => 
    currentScore >= 70 ? "text-green-600" : currentScore >= 50 ? "text-yellow-600" : "text-red-600",
    [currentScore]
  );
  const scoreBgColor = useMemo(() => 
    currentScore >= 70 ? "bg-green-50" : currentScore >= 50 ? "bg-yellow-50" : "bg-red-50",
    [currentScore]
  );
  const scoreLabel = useMemo(() => 
    currentScore >= 70 ? "Excellent" : currentScore >= 50 ? "Good" : "Needs Improvement",
    [currentScore]
  );

  const scoreChange = useMemo(() => 
    previousScore !== undefined ? currentScore - previousScore : null,
    [currentScore, previousScore]
  );
  const changePercent = useMemo(() => 
    scoreChange !== null && previousScore !== undefined && previousScore > 0
      ? ((scoreChange / previousScore) * 100).toFixed(1)
      : null,
    [scoreChange, previousScore]
  );

  const circumference = 2 * Math.PI * 50; // radius = 50
  const offset = useMemo(() => 
    circumference - (currentScore / 100) * circumference,
    [currentScore, circumference]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Growth Score</CardTitle>
        <CardDescription>Your weekly performance composite score</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-8">
          {/* Score Ring */}
          <div className="relative flex-shrink-0">
            <svg width="120" height="120" className="transform -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-cream"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className={scoreColor}
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-display-2 font-bold ${scoreColor}`}>
                {Math.round(currentScore)}
              </div>
              <div className="text-small text-slateSoft">{scoreLabel}</div>
            </div>
          </div>

          {/* Score Details */}
          <div className="flex-1">
            {scoreChange !== null && (
              <div className="flex items-center gap-2 mb-4">
                {scoreChange > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" aria-hidden="true" />
                ) : scoreChange < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-600" aria-hidden="true" />
                ) : (
                  <Minus className="h-4 w-4 text-slateSoft" aria-hidden="true" />
                )}
                <span className={`text-small font-medium ${scoreChange > 0 ? "text-green-600" : scoreChange < 0 ? "text-red-600" : "text-slateSoft"}`}>
                  {scoreChange > 0 ? "+" : ""}{changePercent !== null ? `${changePercent}%` : scoreChange.toFixed(1)} from last week
                </span>
              </div>
            )}

            {breakdown && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-small">
                  <span className="text-slateSoft">Booking Growth</span>
                  <span className="font-medium text-charcoal">{breakdown.bookingGrowth.toFixed(0)}</span>
                </div>
                <div className="flex items-center justify-between text-small">
                  <span className="text-slateSoft">Conversion Rate</span>
                  <span className="font-medium text-charcoal">{breakdown.conversionRate.toFixed(0)}</span>
                </div>
                <div className="flex items-center justify-between text-small">
                  <span className="text-slateSoft">Profile Completeness</span>
                  <span className="font-medium text-charcoal">{breakdown.profileCompleteness.toFixed(0)}</span>
                </div>
                <div className="flex items-center justify-between text-small">
                  <span className="text-slateSoft">Review Average</span>
                  <span className="font-medium text-charcoal">{breakdown.reviewAverage.toFixed(0)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {nextBestAction && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 p-4 rounded-lg border-l-4 ${scoreBgColor} border-sage`}
          >
            <div className="flex items-start gap-2">
              <span className="text-title">💡</span>
              <div>
                <h4 className="font-semibold text-charcoal mb-1">Next Best Action</h4>
                <p className="text-small text-slateSoft">{nextBestAction}</p>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
});

GrowthScoreCard.displayName = "GrowthScoreCard";

export default GrowthScoreCard;

