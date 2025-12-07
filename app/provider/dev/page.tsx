import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import DevDashboardClient from "./DevDashboardClient";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

// Only allow in development
if (process.env.NODE_ENV !== "development") {
  redirect("/");
}

export default async function ProviderDevPage() {
  // Hardcode provider id for dev preview
  const providerId = 1;

  const supabase = createSupabaseServerComponentClient();

  // Check onboarding status
  const { data: onboarding } = await supabase
    .from("provider_onboarding")
    .select("is_complete")
    .eq("provider_id", providerId)
    .single();

  const isOnboardingComplete = onboarding?.is_complete ?? false;

  // Check for onboarding reward
  const { data: onboardingReward } = await supabase
    .from("provider_rewards")
    .select("id, reward_value, created_at")
    .eq("provider_id", providerId)
    .eq("reward_type", "provider_onboarding")
    .maybeSingle();

  const hasOnboardingReward = !!onboardingReward;
  const rewardAmount = onboardingReward?.reward_value
    ? (onboardingReward.reward_value / 100).toFixed(2)
    : "2.00";

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 mb-4">
        <p className="text-sm font-medium text-yellow-800">
          🚧 Dev Preview Mode — Provider ID: {providerId}
        </p>
        <p className="text-xs text-yellow-700 mt-1">
          This is a development-only preview. No authentication required.
        </p>
      </div>

      <DevDashboardClient providerId={providerId} />

      {/* Onboarding Reward Banner */}
      {hasOnboardingReward && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 sm:p-4 md:p-6">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="text-xl sm:text-2xl shrink-0">🎉</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-charcoal mb-1 sm:text-base">
                You&apos;ve earned a £{rewardAmount} onboarding reward!
              </h3>
              <p className="text-small text-charcoal/70 sm:text-sm">
                Congratulations on publishing your first class! Your reward has been added to your account and can be used towards featured listings, class boosts, and other premium features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Banner */}
      {!isOnboardingComplete && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 sm:p-4 md:p-6">
          <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-charcoal mb-1 sm:text-base">Finish Your Onboarding</h3>
              <p className="text-small text-charcoal/70 sm:text-sm">
                Complete your provider profile setup to start attracting more families.
              </p>
            </div>
            <Link
              href="/provider/onboarding"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sage px-4 py-2 font-medium text-white transition hover:bg-sage/90 whitespace-nowrap text-sm sm:px-5 sm:py-2.5"
            >
              Continue Setup
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}

