"use client";

import { ReactNode } from "react";

type MetricStatus = "good" | "warning" | "critical";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  status?: MetricStatus;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
}

const statusColors = {
  good: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    icon: "text-green-600",
  },
  warning: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-800",
    icon: "text-yellow-600",
  },
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    icon: "text-red-600",
  },
  default: {
    bg: "bg-white",
    border: "border-sage/30",
    text: "text-charcoal",
    icon: "text-sage",
  },
};

export default function MetricCard({
  title,
  value,
  subtitle,
  status,
  icon,
  trend,
}: MetricCardProps) {
  const colors = status ? statusColors[status] : statusColors.default;

  return (
    <div
      className={`rounded-2xl border-2 ${colors.border} ${colors.bg} p-4 shadow-soft transition-shadow duration-200 hover:shadow-soft-lg`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {icon && <div className={colors.icon}>{icon}</div>}
            <p className={`text-small font-semibold uppercase tracking-wide ${colors.text}`}>
              {title}
            </p>
          </div>
          <p className={`mt-2 text-display-2 font-bold ${colors.text}`}>
            {typeof value === "number" 
              ? (isNaN(value) ? "—" : value.toLocaleString())
              : (value ?? "—")}
          </p>
          {subtitle && (
            <p className={`mt-1 text-small ${colors.text} opacity-70`}>{subtitle}</p>
          )}
          {trend && trend.value !== null && trend.value !== undefined && (
            <p className={`mt-2 text-small font-medium ${colors.text} opacity-80`}>
              {trend.value > 0 ? "↑" : trend.value < 0 ? "↓" : "→"} {trend.label ?? ""}
            </p>
          )}
        </div>
        {status && (
          <div
            className={`h-3 w-3 rounded-full ${
              status === "good"
                ? "bg-green-500"
                : status === "warning"
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
            aria-label={`Status: ${status}`}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

