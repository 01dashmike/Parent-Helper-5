import { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated, getWellnessUser } from "@/lib/wellness/auth";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import WellnessDashboardClient from "./_components/WellnessDashboardClient";

export const metadata: Metadata = {
  title: "My Dashboard | Wellness | Parent Helper",
  description: "View your saved wellness plans and preferences",
};

export default async function WellnessDashboardPage() {
  // Check if user is authenticated
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect("/wellness/login");
  }

  // Get wellness user data
  const wellnessUser = await getWellnessUser();
  
  // Get recent plans
  const supabase = createSupabaseServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let recentPlans = [];
  if (user) {
    const { data } = await supabase
      .from("wellness_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    
    recentPlans = data || [];
  }

  return (
    <div className="min-h-screen bg-cream py-12 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-2">
            My Wellness Dashboard
          </h1>
          <p className="text-charcoal/70">
            View your saved plans and manage your preferences
          </p>
        </div>

        <WellnessDashboardClient 
          wellnessUser={wellnessUser}
          recentPlans={recentPlans}
        />
      </div>
    </div>
  );
}
