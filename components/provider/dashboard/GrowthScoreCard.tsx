"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { HeroDashboardResponse } from "@/lib/provider/dashboard";

interface GrowthScoreCardProps {
  data: HeroDashboardResponse["growthScore"];
}

export function GrowthScoreCard({ data }: GrowthScoreCardProps) {
  return (
    <Card className="border-sage/30">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-charcoal">Growth Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-4xl font-bold text-charcoal">{data.overall}</span>
            <span className="text-sm text-charcoal/60">/ 100</span>
          </div>
          <Progress value={data.overall} className="h-3" />
        </div>

        {/* Sub-metrics */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-charcoal">Completeness</span>
              <span className="text-sm text-charcoal/60">{data.completeness}%</span>
            </div>
            <Progress value={data.completeness} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-charcoal">Engagement</span>
              <span className="text-sm text-charcoal/60">{data.engagement}%</span>
            </div>
            <Progress value={data.engagement} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-charcoal">Growth</span>
              <span className="text-sm text-charcoal/60">{data.growth}%</span>
            </div>
            <Progress value={data.growth} className="h-2" />
          </div>
        </div>

        {/* Notes */}
        {data.notes.length > 0 && (
          <div className="pt-4 border-t border-sage/20">
            <p className="text-sm font-medium text-charcoal mb-2">Tips to improve:</p>
            <ul className="space-y-1.5">
              {data.notes.map((note, index) => (
                <li key={index} className="text-sm text-charcoal/70 flex items-start gap-2">
                  <span className="text-sage mt-0.5">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}





