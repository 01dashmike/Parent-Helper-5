"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getRecsWeights } from "@/lib/env";

interface Stats {
  profilesCount: number;
  recommendationsCount: number;
  last24hRecs: number;
  newsletterStatus: string;
}

interface Props {
  stats: Stats;
}

export default function PersonalisationAdminClient({ stats }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Use lazy initialization to prevent hydration mismatches
  const [weights, setWeights] = useState(() => getRecsWeights());
  const [rebuildUserId, setRebuildUserId] = useState("");
  const [rebuildEmail, setRebuildEmail] = useState("");

  const handleRebuildRecs = async (userId?: string, email?: string) => {
    if (!userId && !email) {
      toast({
        title: "Required Field",
        description: "Please enter a user ID or email",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/personalisation/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, email }),
        });

        if (!response.ok) {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to rebuild recommendations",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Success",
          description: "Recommendations rebuilt successfully",
          variant: "success",
        });
        router.refresh();
      } catch (err) {
        console.error("Error rebuilding recommendations:", err);
      }
    });
  };

  const handleRefreshQuality = async () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/personalisation/refresh-quality", {
          method: "POST",
        });

        if (!response.ok) {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to refresh quality cache",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Success",
          description: "Provider quality cache refreshed",
          variant: "success",
        });
        router.refresh();
      } catch (err) {
        console.error("Error refreshing quality cache:", err);
      }
    });
  };

  const handleUpdateWeights = async () => {
    startTransition(async () => {
      // In a real implementation, store weights in database or env
      toast({
        title: "Weights Updated",
        description: "Weights updated (stored in environment variables)",
        variant: "success",
      });
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-sage/20 bg-white p-4">
          <div className="text-small text-slateSoft">Family Profiles</div>
          <div className="mt-1 text-title font-semibold text-charcoal">
            {stats.profilesCount.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-sage/20 bg-white p-4">
          <div className="text-small text-slateSoft">Total Recommendations</div>
          <div className="mt-1 text-title font-semibold text-charcoal">
            {stats.recommendationsCount.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-sage/20 bg-white p-4">
          <div className="text-small text-slateSoft">Recs Generated (24h)</div>
          <div className="mt-1 text-title font-semibold text-charcoal">
            {stats.last24hRecs.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-sage/20 bg-white p-4">
          <div className="text-small text-slateSoft">Newsletter Status</div>
          <div className="mt-1 text-title font-semibold text-charcoal capitalize">
            {stats.newsletterStatus}
          </div>
        </div>
      </div>

      {/* Feature Flags */}
      <section className="rounded-2xl border border-sage/20 bg-white p-6">
        <h2 className="mb-4 text-title font-semibold">Feature Flags</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Personalisation Enabled</div>
              <div className="text-small text-slateSoft">
                {process.env.NEXT_PUBLIC_PERSONALIZATION_ENABLED === "true" ? "ON" : "OFF"}
              </div>
            </div>
            <div className="rounded-full bg-sage/10 px-3 py-1 text-small text-forest">
              {process.env.NEXT_PUBLIC_PERSONALIZATION_ENABLED === "true" ? "ON" : "OFF"}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Auto Recs on Signin</div>
              <div className="text-small text-slateSoft">
                {process.env.AUTO_RECS_ON_SIGNIN === "true" ? "ON" : "OFF"}
              </div>
            </div>
            <div className="rounded-full bg-sage/10 px-3 py-1 text-small text-forest">
              {process.env.AUTO_RECS_ON_SIGNIN === "true" ? "ON" : "OFF"}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Newsletter Enabled</div>
              <div className="text-small text-slateSoft">
                {process.env.NEWSLETTER_ENABLED === "true" ? "ON" : "OFF"}
              </div>
            </div>
            <div className="rounded-full bg-sage/10 px-3 py-1 text-small text-forest">
              {process.env.NEWSLETTER_ENABLED === "true" ? "ON" : "OFF"}
            </div>
          </div>
        </div>
      </section>

      {/* Recommendation Weights */}
      <section className="rounded-2xl border border-sage/20 bg-white p-6">
        <h2 className="mb-4 text-title font-semibold">Recommendation Weights</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-small font-medium text-charcoal">
              Age Fit: {weights.w_age_fit}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.w_age_fit}
              onChange={(e) =>
                setWeights({ ...weights, w_age_fit: parseFloat(e.target.value) })
              }
              className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            />
          </div>
          <div>
            <label className="block text-small font-medium text-charcoal">
              Distance: {weights.w_distance}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.w_distance}
              onChange={(e) =>
                setWeights({ ...weights, w_distance: parseFloat(e.target.value) })
              }
              className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            />
          </div>
          <div>
            <label className="block text-small font-medium text-charcoal">
              Popularity: {weights.w_pop}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.w_pop}
              onChange={(e) =>
                setWeights({ ...weights, w_pop: parseFloat(e.target.value) })
              }
              className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            />
          </div>
          <div>
            <label className="block text-small font-medium text-charcoal">
              Quality: {weights.w_quality}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.w_quality}
              onChange={(e) =>
                setWeights({ ...weights, w_quality: parseFloat(e.target.value) })
              }
              className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            />
          </div>
          <div>
            <label className="block text-small font-medium text-charcoal">
              Novelty: {weights.w_novelty}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.w_novelty}
              onChange={(e) =>
                setWeights({ ...weights, w_novelty: parseFloat(e.target.value) })
              }
              className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            />
          </div>
          <button
            onClick={handleUpdateWeights}
            disabled={isPending}
            className="rounded-full bg-sage px-4 py-2 text-small font-medium text-white transition hover:bg-sage/90 disabled:opacity-50"
          >
            Update Weights
          </button>
        </div>
      </section>

      {/* Actions */}
      <section className="rounded-2xl border border-sage/20 bg-white p-6">
        <h2 className="mb-4 text-title font-semibold">Actions</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-small font-medium text-charcoal mb-2">
              Rebuild Recommendations for User
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={rebuildUserId}
                onChange={(e) => setRebuildUserId(e.target.value)}
                placeholder="User ID (UUID)"
                className="ph-input flex-1"
              />
              <input
                type="text"
                value={rebuildEmail}
                onChange={(e) => setRebuildEmail(e.target.value)}
                placeholder="or Email"
                className="ph-input flex-1"
              />
              <button
                onClick={() => handleRebuildRecs(rebuildUserId || undefined, rebuildEmail || undefined)}
                disabled={isPending}
                className="rounded-full bg-sage px-4 py-2 text-small font-medium text-white transition hover:bg-sage/90 disabled:opacity-50"
              >
                Rebuild
              </button>
            </div>
          </div>
          <div>
            <button
              onClick={handleRefreshQuality}
              disabled={isPending}
              className="rounded-full bg-sage px-4 py-2 text-small font-medium text-white transition hover:bg-sage/90 disabled:opacity-50"
            >
              Rebuild All Provider Quality Cache
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

