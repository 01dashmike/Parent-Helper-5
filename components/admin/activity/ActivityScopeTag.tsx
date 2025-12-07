"use client";

import { Badge } from "@/components/ui/badge";

interface ActivityScopeTagProps {
  scope: string;
}

export function ActivityScopeTag({ scope }: ActivityScopeTagProps) {
  const scopeColors: Record<string, string> = {
    provider: "bg-sage/20 text-sage",
    class: "bg-purple-100 text-purple-800",
    booking: "bg-green-100 text-green-800",
    billing: "bg-blue-100 text-blue-800",
    email: "bg-orange-100 text-orange-800",
    system: "bg-gray-100 text-gray-800",
  };

  const colorClass = scopeColors[scope] || "bg-gray-100 text-gray-800";

  return <Badge className={colorClass}>{scope}</Badge>;
}

