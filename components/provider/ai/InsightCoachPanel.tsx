"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, TrendingUp, Lightbulb, Lock } from "lucide-react";
import { aiExplainMyPerformance } from "@/app/provider/ai-actions";
import { useToast } from "@/lib/hooks/useToast";
import Link from "next/link";

type InsightCoachPanelProps = {
  providerId: number;
  hasPremiumAnalytics?: boolean;
};

export default function InsightCoachPanel({
  providerId: _providerId,
  hasPremiumAnalytics = false,
}: InsightCoachPanelProps) {
  const { showSuccess, showError, ToastComponent } = useToast();
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<{
    summary: string;
    keyChanges: Array<{ label: string; changeDescription: string }>;
    suggestions: Array<{ title: string; description: string; impactEstimate: string }>;
  } | null>(null);
  const [timeRange, setTimeRange] = useState<"week" | "month">("week");
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const generateInsights = async () => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("timeRange", timeRange);

      const response = await aiExplainMyPerformance(formData);

      if (response.error) {
        showError(response.error);
        return;
      }

      setInsights(response.data ?? null);
      setLastGenerated(new Date());
      showSuccess("Insights generated!");
    } catch {
      showError("Failed to generate insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-generate on mount
    generateInsights();
  }, [timeRange]);

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sage" />
            <CardTitle>AI Insight Coach</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as "week" | "month")}
              className="rounded-md border border-sage/30 px-2 py-1 text-sm"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
            </select>
            <Button size="sm" variant="outline" onClick={generateInsights} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>
        </div>
        {lastGenerated && (
          <p className="text-xs text-slateSoft">Generated at {lastGenerated.toLocaleTimeString()}</p>
        )}
      </CardHeader>
      <CardContent>
        {loading && !insights ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-sage" />
          </div>
        ) : insights ? (
          <div className="space-y-6">
            {/* Summary */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-sage" />
                <Label className="text-sm font-semibold">Your Performance Summary</Label>
              </div>
              <p className="text-sm text-charcoal">{insights.summary}</p>
            </div>

            {/* Key Changes */}
            {insights.keyChanges.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-2 block">Key Changes</Label>
                <div className="space-y-2">
                  {insights.keyChanges.map((change, i) => (
                    <div key={i} className="rounded-lg border border-sage/20 bg-cream/30 p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{change.label}</p>
                          <p className="text-xs text-slateSoft mt-1">{change.changeDescription}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {insights.suggestions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Actionable Suggestions</Label>
                  {!hasPremiumAnalytics && (
                    <Badge variant="outline" className="text-xs">
                      <Lock className="mr-1 h-3 w-3" />
                      Some insights require Premium
                    </Badge>
                  )}
                </div>
                <div className="space-y-3">
                  {insights.suggestions.map((suggestion, i) => {
                    const isPremium = i >= 2 && !hasPremiumAnalytics;
                    return (
                      <div
                        key={i}
                        className={`rounded-lg border p-4 ${
                          isPremium
                            ? "border-sage/20 bg-cream/30 blur-sm"
                            : "border-sage/30 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Lightbulb className="h-4 w-4 text-amber-500" />
                              <p className="text-sm font-medium">{suggestion.title}</p>
                            </div>
                            <p className="text-xs text-slateSoft mb-2">{suggestion.description}</p>
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.impactEstimate}
                            </Badge>
                          </div>
                        </div>
                        {isPremium && (
                          <div className="mt-2 text-center">
                            <Button size="sm" variant="outline" asChild>
                              <Link href="/provider/upgrade/analytics">
                                Unlock with Premium Analytics
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slateSoft text-center py-4">
            Click &quot;Refresh&quot; to generate insights
          </p>
        )}
      </CardContent>
    </Card>
    {ToastComponent}
    </>
  );
}

// Add Label import if not already available
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}

