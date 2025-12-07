import { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isReviewsFeatureEnabled } from "@/lib/env";
import ReviewsClient from "./ReviewsClient";

export const metadata: Metadata = {
  title: "Reviews | Provider Console",
  robots: "noindex, nofollow",
};

// Revalidate every 5 minutes - reviews change occasionally
export const revalidate = 300;

export default async function ProviderReviewsPage() {
  if (!isReviewsFeatureEnabled()) {
    redirect("/provider");
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user ?? null;

  if (!user) {
    redirect("/provider/login");
  }

  // Get provider ID from provider_accounts
  const { data: account } = await supabase
    .from("provider_accounts")
    .select("provider_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (!account) {
    redirect("/provider");
  }

  // Parallelize reviews and reputation fetching
  const [reviewsResult, reputationResult] = await Promise.all([
    supabase
      .from("provider_reviews")
      .select("*, helpful_count, not_helpful_count")
      .eq("provider_id", account.provider_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("provider_reputation")
      .select("*")
      .eq("provider_id", account.provider_id)
      .single(),
  ]);

  return (
    <ReviewsClient
      reviews={reviewsResult.data || []}
      reputation={reputationResult.data || null}
      providerId={account.provider_id}
    />
  );
}

