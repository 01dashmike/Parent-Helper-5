"use client";

import { AlertCircle, Info, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: string;
  actionUrl?: string;
}

interface NextBestActionPanelProps {
  recommendations: AIRecommendation[];
  loading?: boolean;
}

export function NextBestActionPanel({ recommendations, loading }: NextBestActionPanelProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Next Best Actions</CardTitle>
          <CardDescription>Loading recommendations...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Next Best Actions</CardTitle>
          <CardDescription>No recommendations available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "medium":
        return <Info className="h-5 w-5 text-yellow-600" />;
      default:
        return <Sparkles className="h-5 w-5 text-sage" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-sage" />
          Next Best Actions
        </CardTitle>
        <CardDescription>
          AI-powered recommendations to improve your performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec) => (
          <div
            key={rec.title || rec.description}
            className="rounded-lg border border-sage/20 bg-white p-4 hover:shadow-md transition-shadow"
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="flex items-start gap-2">
                {getPriorityIcon(rec.priority)}
                <div>
                  <h4 className="font-semibold text-charcoal">{rec.title}</h4>
                  <p className="mt-1 text-small text-slateSoft">{rec.description}</p>
                </div>
              </div>
              <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
            </div>
            {rec.actionUrl && (
              <a
                href={rec.actionUrl}
                className="mt-2 inline-block text-small font-medium text-sage hover:underline"
              >
                Take action →
              </a>
            )}
          </div>
        ))}
        <div className="rounded-lg border border-sage/20 bg-cream/50 p-3">
          <p className="text-small text-slateSoft">
            <strong>Note:</strong> These recommendations are generated based on your current metrics. Focus on high-priority items first for the biggest impact.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

