"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeroDashboardResponse } from "@/lib/provider/dashboard";

interface AlertsPanelProps {
  alerts: HeroDashboardResponse["alerts"];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <Card className="border-sage/30">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-charcoal">Alerts & Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-charcoal/60">No alerts at this time. Keep up the great work!</p>
        </CardContent>
      </Card>
    );
  }

  const getIcon = (type: "warning" | "info" | "success") => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-600" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
  };

  const getBorderColor = (type: "warning" | "info" | "success") => {
    switch (type) {
      case "warning":
        return "border-yellow-200 bg-yellow-50";
      case "info":
        return "border-blue-200 bg-blue-50";
      case "success":
        return "border-green-200 bg-green-50";
    }
  };

  return (
    <Card className="border-sage/30">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-charcoal">Alerts & Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "rounded-lg border p-4",
              getBorderColor(alert.type)
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">{getIcon(alert.type)}</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-charcoal mb-1">{alert.title}</h4>
                <p className="text-sm text-charcoal/70 mb-3">{alert.description}</p>
                {alert.ctaHref && alert.ctaLabel && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full sm:w-auto"
                  >
                    <Link href={alert.ctaHref}>{alert.ctaLabel}</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}








