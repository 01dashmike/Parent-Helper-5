"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { formatDateWithWeekday } from "@/lib/utils/date";

interface Insight {
  id: string;
  summary: string;
  created_at: string;
  recommendations?: string[];
}

export default function AIInsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [formattedDates, setFormattedDates] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchInsights();
  }, []);

  // Format dates on client side to avoid hydration mismatches
  useEffect(() => {
    const formatted: Record<string, string> = {};
    insights.forEach((insight) => {
      formatted[insight.id] = formatDateWithWeekday(insight.created_at);
    });
    setFormattedDates(formatted);
  }, [insights]);

  async function fetchInsights() {
    try {
      const response = await fetch("/api/admin/automation/insights");
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights || []);
      }
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const response = await fetch("/api/admin/automation/insights", {
        method: "POST",
      });
      if (response.ok) {
        await fetchInsights();
      }
    } catch (error) {
      console.error("Error regenerating insights:", error);
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="motion-safe:animate-pulse motion-reduce:animate-none space-y-4">
            <div className="h-4 bg-sage/20 rounded w-3/4"></div>
            <div className="h-4 bg-sage/20 rounded w-full"></div>
            <div className="h-4 bg-sage/20 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-title font-semibold text-charcoal">AI Growth Insights</h2>
          <p className="text-small text-slateSoft mt-1">
            Weekly AI-generated insights and recommendations
          </p>
        </div>
        <Button
          onClick={handleRegenerate}
          disabled={regenerating}
          aria-busy={regenerating ? "true" : "false"}
          className="bg-sage hover:bg-sage/90"
        >
          {regenerating ? (
            <span role="status" aria-live="polite" className="inline-flex items-center">
              <RefreshCw className="mr-2 h-4 w-4 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden="true" />
              <VisuallyHidden>Regenerating insights...</VisuallyHidden>
            </span>
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          Regenerate Insights
        </Button>
      </div>

      {insights.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Sparkles className="h-12 w-12 text-sage/40 mx-auto mb-4" />
            <p className="text-slateSoft">
              No insights yet. Click &quot;Regenerate Insights&quot; to generate your first report.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <Card key={insight.id}>
              <CardHeader>
                <CardTitle className="text-title">Weekly Summary</CardTitle>
                <CardDescription>
                  {formattedDates[insight.id] || "Loading..."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-charcoal whitespace-pre-line">{insight.summary}</p>
                {insight.recommendations && insight.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-charcoal mb-small">Recommendations:</h3>
                    <ul className="list-disc list-inside space-y-1 text-slateSoft">
                      {insight.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
