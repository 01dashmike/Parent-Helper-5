"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

interface VisibilityBoostData {
  boost_type: string;
  multiplier: number;
  expires_at?: string;
}

interface VisibilityBoostBadgeProps {
  providerId: number;
}

export default function VisibilityBoostBadge({ providerId }: VisibilityBoostBadgeProps) {
  const [boost, setBoost] = useState<VisibilityBoostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchBoost() {
      try {
        const response = await fetch(`/api/providers/visibility-boost?provider_id=${providerId}`);
        if (cancelled) return;
        
        if (response.ok) {
          const result = await response.json();
          if (!cancelled && result) {
            setBoost(result);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error fetching visibility boost:", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchBoost();

    return () => {
      cancelled = true;
    };
  }, [providerId]);

  if (loading || !boost || !boost.multiplier || boost.multiplier <= 1.0) {
    return null;
  }

  const boostPercent = Math.round((boost.multiplier - 1) * 100);

  return (
    <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-yellow-600" />
        <div>
          <div className="text-sm font-semibold text-yellow-900">Visibility Boost Active</div>
          <div className="text-small text-yellow-700">
            {boost.boost_type || "Premium"} Tier: +{boostPercent}% exposure in search results
          </div>
        </div>
      </div>
    </div>
  );
}

