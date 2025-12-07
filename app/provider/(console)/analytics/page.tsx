import { Metadata } from "next";
import ProviderAnalyticsClient from "./ProviderAnalyticsClient";
import { getSupabaseServer } from "@/lib/supabase.server";
import { createSupabaseServerComponentClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Analytics Dashboard | Provider Console",
  description: "View your class performance, bookings, and growth metrics",
  robots: "noindex, nofollow",
};

// Revalidate: 60 seconds for provider analytics
// Analytics data updates frequently but can be cached briefly
export const revalidate = 60;

export default async function ProviderAnalyticsPage() {
  const supabase = createSupabaseServerComponentClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user ?? null;

  if (!user) {
    return (
      <div className="min-h-[50vh] bg-cream px-4 py-20 text-center text-charcoal">
        <h1 className="text-2xl font-semibold">Please log in</h1>
        <p className="mt-4 text-slateSoft">You must be logged in to view analytics.</p>
      </div>
    );
  }

  const serverSupabase = getSupabaseServer();
  if (!serverSupabase) {
    return (
      <div className="min-h-[50vh] bg-cream px-4 py-20 text-center text-charcoal">
        <h1 className="text-2xl font-semibold">Service unavailable</h1>
        <p className="mt-4 text-slateSoft">Unable to connect to database.</p>
      </div>
    );
  }

  // Get provider ID
  const { data: provider } = await serverSupabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!provider) {
    return (
      <div className="min-h-[50vh] bg-cream px-4 py-20 text-center text-charcoal">
        <h1 className="text-2xl font-semibold">Provider not found</h1>
        <p className="mt-4 text-slateSoft">Please complete your provider profile.</p>
      </div>
    );
  }

  return <ProviderAnalyticsClient providerId={provider.id} />;
}
