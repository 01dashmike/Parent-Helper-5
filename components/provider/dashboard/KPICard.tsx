"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string;
  changePercent?: number | null;
  icon?: ReactNode;
  className?: string;
}

export function KPICard({ label, value, changePercent, icon, className }: KPICardProps) {
  const hasChange = changePercent !== null && changePercent !== undefined;
  const isPositive = hasChange && changePercent > 0;
  const isNegative = hasChange && changePercent < 0;

  return (
    <Card className={cn("border-sage/30", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-charcoal/60 uppercase tracking-wide mb-2">
              {label}
            </p>
            <p className="text-3xl font-bold text-charcoal">{value}</p>
            {hasChange && (
              <div className="mt-3 flex items-center gap-1.5">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : isNegative ? (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ) : null}
                <span
                  className={cn(
                    "text-sm font-medium",
                    isPositive && "text-green-600",
                    isNegative && "text-red-600",
                    !isPositive && !isNegative && "text-charcoal/60"
                  )}
                >
                  {isPositive ? "+" : ""}
                  {changePercent}% vs last week
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className="ml-4 flex-shrink-0 text-sage/40">{icon}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}








