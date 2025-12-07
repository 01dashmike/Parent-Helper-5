"use client";

import { Badge } from "@/components/ui/badge";

interface ActivityLevelBadgeProps {
  level: "info" | "warning" | "error";
}

export function ActivityLevelBadge({ level }: ActivityLevelBadgeProps) {
  const colors = {
    info: "bg-blue-100 text-blue-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
  };

  return (
    <Badge className={colors[level]}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </Badge>
  );
}

