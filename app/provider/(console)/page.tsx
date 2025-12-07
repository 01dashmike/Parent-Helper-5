import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { getActiveMembershipForUser } from "../_lib/membership";
import { getHeroDashboardData } from "@/lib/provider/dashboard";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import the hero client for better performance
const ProviderDashboardHeroClient = dynamic(() => import("./ProviderDashboardHeroClient"), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: true,
});

// Revalidate every 2 minutes - dashboard data changes frequently
export const revalidate = 120;

type UpcomingOccurrence = {
  id: string;
  starts_at: string;
  ends_at: string | null;
  status: string;
  classes: { title: string | null } | null;
  venues: { name: string | null } | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function ProviderOverviewPage() {
  const supabase = createSupabaseServerComponentClient();
  const { data, error } = await supabase.auth.getSession();
  const session = data?.session ?? null;

  if (!session?.user) {
    redirect("/provider/login");
  }

  const membership = await getActiveMembershipForUser(supabase, session.user.id);
  if (!membership?.providers) {
    redirect("/provider/login");
  }

  const providerId = membership.provider_id;
  const nowIso = new Date().toISOString();

  // Parallelize ALL data fetching for maximum performance
  const [
    onboardingResult,
    classesCountResult,
    publishedCountResult,
    venuesCountResult,
    upcomingResult,
    onboardingRewardResult,
    heroData,
  ] = await Promise.all([
    // Onboarding status
    // Note: provider_onboarding.provider_id may be UUID, handle errors gracefully
    supabase
      .from("provider_onboarding")
      .select("is_complete, current_step")
      .eq("provider_id", providerId)
      .maybeSingle(),
    // Classes count
    supabase
      .from("classes")
      .select("id", { count: "exact", head: true })
      .eq("provider_id", providerId),
    // Published classes count
    supabase
      .from("classes")
      .select("id", { count: "exact", head: true })
      .eq("provider_id", providerId)
      .eq("is_published", true),
    // Venues count
    supabase
      .from("venues")
      .select("id", { count: "exact", head: true })
      .eq("provider_id", providerId),
    // Upcoming occurrences
    supabase
      .from("class_occurrences")
      .select(
        "id, starts_at, ends_at, status, classes:classes ( title ), venues:venues ( name )"
      )
      .eq("provider_id", providerId)
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(5) as unknown as Promise<{
        data: UpcomingOccurrence[] | null;
        error: any;
      }>,
    // Onboarding reward
    supabase
      .from("provider_rewards")
      .select("id, reward_value, created_at")
      .eq("provider_id", providerId)
      .eq("reward_type", "provider_onboarding")
      .maybeSingle(),
    // Hero dashboard data (already cached internally)
    getHeroDashboardData(providerId),
  ]);

  const onboarding = onboardingResult.data;
  const onboardingError = onboardingResult.error;

  // Log onboarding query errors for debugging
  if (onboardingError) {
    console.error("[ProviderOverviewPage] Error querying provider_onboarding:", {
      error: onboardingError.message,
      code: onboardingError.code,
      providerId,
      providerIdType: typeof providerId,
    });
  }

  // If onboarding record doesn't exist or is not complete, redirect to wizard
  // This handles both missing records and incomplete onboarding
  if (!onboarding || !onboarding.is_complete) {
    redirect("/provider/onboarding");
  }

  const totalClasses = classesCountResult.count ?? 0;
  const publishedClasses = publishedCountResult.count ?? 0;
  const totalVenues = venuesCountResult.count ?? 0;
  const upcomingOccurrences = upcomingResult.data ?? [];
  const isOnboardingComplete = onboarding?.is_complete ?? false;

  const onboardingReward = onboardingRewardResult.data;
  const hasOnboardingReward = !!onboardingReward;
  const rewardAmount = onboardingReward?.reward_value
    ? (onboardingReward.reward_value / 100).toFixed(2)
    : "2.00";

  return (
    <div className="space-y-8">
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

      {/* Hero Dashboard */}
      <ProviderDashboardHeroClient initialData={heroData} />

      {/* Legacy sections - keep for now, can be removed later */}
      <section>
        <h2 className="text-lg font-semibold text-charcoal sm:text-xl">At a glance</h2>
        <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 sm:grid-cols-2 md:grid-cols-3">
          <article className="rounded-xl border border-sage/30 bg-white p-5 shadow-sm">
            <p className="text-small uppercase tracking-wide text-charcoal/80">Total classes</p>
            <p className="mt-2 text-3xl font-semibold text-charcoal">{totalClasses}</p>
            <p className="mt-1 text-sm text-charcoal/70">
              {publishedClasses} published, {totalClasses - publishedClasses} drafts
            </p>
          </article>
          <article className="rounded-xl border border-sage/30 bg-white p-5 shadow-sm">
            <p className="text-small uppercase tracking-wide text-charcoal/80">Venues</p>
            <p className="mt-2 text-3xl font-semibold text-charcoal">{totalVenues}</p>
            <p className="mt-1 text-sm text-charcoal/70">
              Keep venue details accurate for better discovery.
            </p>
          </article>
          <article className="rounded-xl border border-sage/30 bg-white p-5 shadow-sm">
            <p className="text-small uppercase tracking-wide text-charcoal/80">Upcoming sessions</p>
            <p className="mt-2 text-3xl font-semibold text-charcoal">
              {upcomingOccurrences.length}
            </p>
            <p className="mt-1 text-sm text-charcoal/70">
              Next {upcomingOccurrences.length ? "week of" : "sessions appear here when scheduled."}
            </p>
          </article>
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-charcoal sm:text-xl">Next sessions</h2>
          <p className="text-small text-charcoal/60">
            Showing the next 5 occurrences scheduled after today.
          </p>
        </div>
        <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
          {upcomingOccurrences.length === 0 ? (
            <div className="rounded-lg border border-sage/30 bg-white p-4 text-center sm:p-6" role="status" aria-live="polite">
              <h3 className="text-sm font-semibold text-charcoal mb-1 sm:text-base">No upcoming sessions</h3>
              <p className="text-small text-charcoal/70 sm:text-sm">
                Plan ahead by adding upcoming sessions. Once scheduled, they will appear here for a quick snapshot.
              </p>
            </div>
          ) : (
            upcomingOccurrences.map((occurrence) => (
              <div
                key={occurrence.id}
                className="flex flex-col gap-2 rounded-lg border border-sage/30 bg-white p-3 shadow-sm sm:p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-small font-semibold text-charcoal sm:text-sm break-words">
                    {occurrence.classes?.title ?? "Untitled class"}
                  </p>
                  <p className="text-small text-charcoal/60">
                    {occurrence.venues?.name ?? "No venue"}
                  </p>
                </div>
                <div className="text-small text-charcoal/80 sm:text-sm">
                  <p>{dateFormatter.format(new Date(occurrence.starts_at))}</p>
                  {occurrence.ends_at ? (
                    <p className="text-small text-charcoal/60">
                      Ends {dateFormatter.format(new Date(occurrence.ends_at))}
                    </p>
                  ) : null}
                </div>
                <span className="inline-flex w-fit rounded-full bg-sage/15 px-2 py-1 text-small font-medium uppercase tracking-wide text-forest sm:px-3">
                  {occurrence.status}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

