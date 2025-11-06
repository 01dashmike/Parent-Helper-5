import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import InsightsDashboard from "@/components/admin/InsightsDashboard";

export const metadata: Metadata = {
  title: "Analytics Insights | Parent Helper Admin",
  description: "View anonymized usage analytics and insights",
  robots: "noindex, nofollow", // Keep admin pages out of search
};

// Use service role for server-side data fetching
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Server Component - fetches data
export default async function InsightsPage() {
  const days = 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // Fetch analytics events from last 30 days
  const { data: events, error } = await supabase
    .from("analytics_events")
    .select("*")
    .gte("created_at", cutoffDate.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch analytics:", error);
    return (
      <div className="min-h-screen bg-cream p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-charcoal mb-4">Analytics Insights</h1>
          <div className="rounded-2xl border border-sage/20 bg-white p-6 text-center">
            <p className="text-slateSoft">
              Failed to load analytics data. Please check your Supabase configuration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-2">Analytics Insights</h1>
          <p className="text-slateSoft">
            Privacy-first analytics showing anonymous usage patterns
          </p>
        </div>

        {/* Client component for interactive charts */}
        <InsightsDashboard events={events || []} />
      </div>
    </div>
  );
}


