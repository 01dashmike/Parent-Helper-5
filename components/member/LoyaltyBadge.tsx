"use client";

import { useState, useId } from "react";
import { Trophy, Info } from "lucide-react";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { iconSize } from "@/lib/icons/tokens";

type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

interface LoyaltyBadgeProps {
  tier: LoyaltyTier;
  tooltip?: string;
}

const tierConfig: Record<LoyaltyTier, { label: string; color: string; bgColor: string }> = {
  bronze: {
    label: "Bronze Family",
    color: "#CD7F32",
    bgColor: "#CD7F32",
  },
  silver: {
    label: "Silver Family",
    color: "#C0C0C0",
    bgColor: "#C0C0C0",
  },
  gold: {
    label: "Gold Family",
    color: "#FFD700",
    bgColor: "#FFD700",
  },
  platinum: {
    label: "Platinum Family",
    color: "#E5E4E2",
    bgColor: "#E5E4E2",
  },
};

export default function LoyaltyBadge({ tier, tooltip }: LoyaltyBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = tierConfig[tier] || tierConfig.bronze;
  const infoIconId = useId();

  return (
    <div className="relative inline-flex items-center">
      <div
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-small font-medium text-white shadow-sm"
        style={{
          backgroundColor: config.bgColor,
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Trophy size={iconSize.sm} aria-hidden="true" />
        <span>{config.label}</span>
        {tooltip && (
          <>
            <Info 
              size={iconSize.sm} 
              className="opacity-80" 
              aria-describedby={infoIconId}
              aria-hidden="true"
            />
            <VisuallyHidden id={infoIconId}>
              {tooltip}
            </VisuallyHidden>
          </>
        )}
      </div>
      
      {showTooltip && tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 w-64 rounded-lg border border-sage/20 bg-white p-3 shadow-elevated">
          <p className="text-small text-charcoal">{tooltip}</p>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 border-r border-b border-sage/20 bg-white"></div>
        </div>
      )}
    </div>
  );
}

