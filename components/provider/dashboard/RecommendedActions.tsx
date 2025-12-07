"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeroDashboardResponse } from "@/lib/provider/dashboard";

interface RecommendedActionsProps {
  actions: HeroDashboardResponse["recommendedActions"];
}

export function RecommendedActions({ actions }: RecommendedActionsProps) {
  if (actions.length === 0) {
    return (
      <Card className="border-sage/30">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-charcoal">Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-charcoal/60">You&apos;re doing great! No immediate actions needed.</p>
        </CardContent>
      </Card>
    );
  }

  const getImpactColor = (impact: "low" | "medium" | "high") => {
    switch (impact) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <Card className="border-sage/30">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-charcoal">Recommended Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action) => (
          <div
            key={action.id}
            className="rounded-lg border border-sage/20 bg-white p-4 hover:border-sage/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h4 className="text-sm font-semibold text-charcoal flex-1">{action.title}</h4>
              <Badge
                variant="outline"
                className={cn("text-xs", getImpactColor(action.impact))}
              >
                {action.impact} impact
              </Badge>
            </div>
            <p className="text-sm text-charcoal/70 mb-3">{action.description}</p>
            {action.estimatedLiftPercent && (
              <p className="text-xs text-sage font-medium mb-3">
                Estimated lift: +{action.estimatedLiftPercent}%
              </p>
            )}
            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
              <Link href={action.ctaHref}>
                {action.ctaLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}


