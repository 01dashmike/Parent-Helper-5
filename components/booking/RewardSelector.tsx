"use client";

import { useState, useEffect } from "react";
import { Gift, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface Reward {
  id: string;
  value_cents: number;
  points: number;
  source: string;
  status?: string;
  metadata?: {
    expires_at?: string;
    stripe_coupon_id?: string;
  };
}

export interface RewardSelectorProps {
  onRewardSelected: (rewardId: string | null, couponId: string | null, couponValueCents: number | null) => void;
  bookingAmountCents: number;
}

export function RewardSelector({ bookingAmountCents, onRewardSelected }: RewardSelectorProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; value_cents: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRewards() {
      try {
        const response = await fetch("/api/rewards/summary");
        if (!response.ok) {
          throw new Error("Failed to fetch rewards");
        }
        const result = await response.json();
        if (result.success && result.data?.rewards) {
          // Filter to only available rewards
          const availableRewards = result.data?.rewards?.filter(
            (r: { status?: string | null; value_cents?: number | null }) => r.status === "available" && (r.value_cents || 0) > 0
          ) || [];
          setRewards(availableRewards);
        }
      } catch (err) {
        console.error("[RewardSelector] Unexpected error:", err);
        setError("Unable to load rewards");
      } finally {
        setLoading(false);
      }
    }

    fetchRewards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Reason: effect should only run once on mount to fetch rewards
  }, []);

  const handleRewardSelect = async (rewardId: string) => {
    if (selectedRewardId === rewardId) {
      // Deselect if already selected
      setSelectedRewardId(null);
      setAppliedCoupon(null);
      onRewardSelected(null, null, null);
      return;
    }

    setRedeemingRewardId(rewardId);
    setError(null);

    try {
      // Redeem reward to get Stripe coupon
      const response = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reward_id: rewardId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to redeem reward");
      }

      const couponId = result.data?.stripe_coupon_id;
      if (!couponId) {
        throw new Error("No coupon ID returned");
      }

      // Validate coupon with Stripe (via our API)
      const validateResponse = await fetch(`/api/rewards/validate-coupon?coupon_id=${couponId}`);
      const validateResult = await validateResponse.json();

      if (!validateResponse.ok || !validateResult.valid) {
        throw new Error(validateResult.error || "Coupon validation failed");
      }

      setSelectedRewardId(rewardId);
      const valueCents = result.data?.value_cents ?? 0;
      setAppliedCoupon({
        id: couponId,
        value_cents: valueCents,
      });
      onRewardSelected(rewardId, couponId, valueCents);
    } catch (err: unknown) {
      console.error("[RewardSelector] Unexpected error:", err);
      setError(err instanceof Error ? err.message : "Failed to apply reward");
      setSelectedRewardId(null);
      setAppliedCoupon(null);
      onRewardSelected(null, null, null);
    } finally {
      setRedeemingRewardId(null);
    }
  };

  // Use shared formatting utility
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-sage/20 bg-white p-4" role="status" aria-live="polite" aria-label="Loading">
        <div className="flex items-center gap-2 text-slateSoft">
          <Loader2 className="h-4 w-4 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden="true" />
          <span className="text-small">Loading rewards...</span>
        </div>
      </div>
    );
  }

  if (rewards.length === 0) {
    return null; // Don't show anything if no rewards available
  }

  return (
    <div className="rounded-lg border border-sage/20 bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
        <Gift className="h-5 w-5 text-sage" aria-hidden="true" />
        <h3 className="font-semibold text-charcoal">Apply Reward</h3>
      </div>

      {error && (
        <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-small text-red-800">
          {error}
        </div>
      )}

      {appliedCoupon && (
        <div className="mb-3 rounded border border-green-200 bg-green-50 p-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden="true" />
              <span className="text-small font-medium text-green-800">
                Reward Applied: {formatCurrency(appliedCoupon.value_cents)} off
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedRewardId(null);
                setAppliedCoupon(null);
                onRewardSelected(null, null, null);
              }}
              className="text-small text-green-700 hover:text-green-900 underline"
              aria-label={`Remove ${formatCurrency(appliedCoupon.value_cents)} reward`}
            >
              Remove
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {rewards.map((reward) => {
          const isSelected = selectedRewardId === reward.id;
          const isRedeeming = redeemingRewardId === reward.id;
          const isDisabled = redeemingRewardId !== null && redeemingRewardId !== reward.id;

          // Don't show rewards larger than booking amount
          if (reward.value_cents > bookingAmountCents) {
            return null;
          }

          return (
            <button
              key={reward.id}
              type="button"
              onClick={() => handleRewardSelect(reward.id)}
              disabled={isDisabled}
              aria-label={`${isSelected ? "Remove" : "Apply"} ${formatCurrency(reward.value_cents)} reward`}
              aria-pressed={isSelected}
              className={`w-full rounded-lg border p-3 text-left transition ${
                isSelected
                  ? "border-sage bg-sage/10"
                  : "border-sage/20 bg-white hover:bg-cream/50"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-charcoal">
                    {formatCurrency(reward.value_cents)} Reward
                  </div>
                  <div className="text-small text-slateSoft">
                    {reward.source === "referral" ? "Referral reward" : "Reward"}
                    {reward.points > 0 && ` • ${reward.points} points`}
                  </div>
                </div>
                {isRedeeming ? (
                  <span role="status" aria-live="polite" aria-label="Loading">
                    <Loader2 className="h-4 w-4 motion-safe:animate-spin motion-reduce:animate-none text-sage" aria-hidden="true" />
                  </span>
                ) : isSelected ? (
                  <CheckCircle2 className="h-5 w-5 text-sage" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-sage/30" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {appliedCoupon && (
        <div className="mt-3 rounded bg-cream/50 p-2 text-small text-slateSoft">
          Discount will be applied at checkout
        </div>
      )}
    </div>
  );
}

