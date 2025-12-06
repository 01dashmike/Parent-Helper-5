'use client';

import { useState } from 'react';
import { Crown, Check } from 'lucide-react';
import { iconSize } from '@/lib/icons/tokens';
import { LoadingSpinner } from '@/components/spinners/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/errormessage';
import { Button } from '@/components/ui/button';

type UpgradeToFeaturedProps = {
  classId: number | string;
  providerId: number;
  planSlug?: string;
};

type UpgradeStatus =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export function UpgradeToFeatured({
  classId,
  planSlug = "promote",
  providerId,
}: UpgradeToFeaturedProps) {
  const [status, setStatus] = useState<UpgradeStatus>({ type: "idle" });

  const handleUpgrade = async () => {
    setStatus({ type: "loading" });

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug,
          providerId,
          successUrl:
            typeof window !== "undefined"
              ? `${window.location.origin}/billing/success?class_id=${classId}`
              : undefined,
          cancelUrl:
            typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error ?? "Checkout session request failed.");
      }

      const { url } = await response.json();

      if (typeof window !== "undefined" && url) {
        window.location.href = url;
        return;
      }

      setStatus({
        type: "success",
        message:
          "Checkout session created. Follow the Stripe link to continue.",
      });
    } catch (error) {
      console.error("[UpgradeToFeatured] Unexpected error:", error);
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "We could not start checkout. Please try again or contact support.",
      });
    }
  };

  return (
    <div className="rounded-surface border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 p-6" aria-busy={status.type === "loading"}>
      <div className="flex items-start gap-4">
        <div className="rounded-card bg-amber-500 p-3">
          <Crown size={iconSize.lg} className="text-white" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h3 className="mb-small text-title font-bold text-charcoal">
            Upgrade to Featured
          </h3>
          <p className="mb-4 text-charcoal">
            Get 3× more visibility and bookings
          </p>
          <ul className="mb-6 space-y-2">
            {[
              "Appear at the top of search results",
              "Gold badge highlighting across the site",
              "Priority inclusion in parent newsletters",
              "Featured social media shout-outs",
              "Monthly engagement analytics report",
            ].map((benefit) => (
              <li
                key={benefit}
                className="flex items-center text-small text-charcoal"
              >
                <Check size={iconSize.sm} className="mr-2 text-green-600" aria-hidden="true" />
                {benefit}
              </li>
            ))}
          </ul>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-display-2 font-bold text-charcoal">£10</span>
            <span className="text-charcoal">/month per location</span>
          </div>
          <Button
            type="button"
            onClick={handleUpgrade}
            disabled={status.type === "loading"}
            aria-disabled={status.type === "loading"}
            size="lg"
            variant="default"
            className="w-full gap-2 bg-amber-500 text-white shadow-sm hover:bg-amber-600"
            aria-label={status.type === "loading" ? "Preparing checkout" : "Upgrade to featured listing"}
          >
            {status.type === "loading" ? (
              <>
                <LoadingSpinner size="sm" label="Preparing checkout" />
                <span>Preparing checkout…</span>
              </>
            ) : (
              <>
                <Crown size={iconSize.sm} aria-hidden="true" />
                <span>Upgrade now</span>
              </>
            )}
          </Button>
          {status.type === "success" && (
            <p 
              className="mt-3 rounded-card bg-emerald-50 px-3 py-2 text-small text-emerald-700"
              role="status"
              aria-live="polite"
            >
              {status.message}
            </p>
          )}
          {status.type === "error" && (
            <ErrorMessage
              error={status.message}
              variant="inline"
              onRetry={handleUpgrade}
            />
          )}
        </div>
      </div>
    </div>
  );
}
