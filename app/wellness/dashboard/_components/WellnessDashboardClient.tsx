"use client";

import { useRouter } from "next/navigation";
import { signOutWellnessAction } from "../../(auth)/actions";
import { Button } from "@/components/ui/button";

interface WellnessDashboardClientProps {
  wellnessUser: any;
  recentPlans: any[];
}

export default function WellnessDashboardClient({
  wellnessUser,
  recentPlans,
}: WellnessDashboardClientProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOutWellnessAction();
  };

  const getPlanTypeLabel = (type: string) => {
    const labels = {
      meal: "Meal Plan",
      exercise: "Exercise Plan",
      supplement: "Supplement Guide",
      product: "Product Check",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getAudienceLabel = (audience: string) => {
    const labels = {
      mum: "Mum",
      dad: "Dad",
      couples: "Couples",
      family: "Family",
      grandparents: "Grandparents",
    };
    return labels[audience as keyof typeof labels] || audience;
  };

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <div className="rounded-2xl bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-charcoal mb-2">
              Account Information
            </h2>
            <p className="text-charcoal/70">
              <strong>Email:</strong> {wellnessUser?.email}
            </p>
            <div className="mt-3 flex gap-4 text-sm">
              <span className={wellnessUser?.newsletter_subscribed ? "text-green-600" : "text-charcoal/60"}>
                {wellnessUser?.newsletter_subscribed ? "✓" : "○"} Newsletter Subscribed
              </span>
              <span className={wellnessUser?.accountability_emails_enabled ? "text-green-600" : "text-charcoal/60"}>
                {wellnessUser?.accountability_emails_enabled ? "✓" : "○"} Accountability Emails
                {wellnessUser?.accountability_emails_enabled && ` (${wellnessUser.accountability_frequency})`}
              </span>
            </div>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl bg-white p-6 shadow-soft">
        <h2 className="text-xl font-semibold text-charcoal mb-4">
          Create New Plan
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Meal Plan", icon: "", href: "/wellness/mum/diet" },
            { label: "Exercise Plan", icon: "", href: "/wellness/mum/exercise" },
            { label: "Supplement Guide", icon: "", href: "/wellness/mum/supplements" },
            { label: "Browse All", icon: "", href: "/wellness" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className="rounded-lg border border-sage/20 bg-sage/5 p-4 text-center transition-all hover:border-sage hover:bg-sage/10"
            >
              <div className="mb-2 text-3xl">{action.icon}</div>
              <div className="font-medium text-charcoal">{action.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Plans */}
      <div className="rounded-2xl bg-white p-6 shadow-soft">
        <h2 className="text-xl font-semibold text-charcoal mb-4">
          Recent Plans
        </h2>
        {recentPlans.length === 0 ? (
          <p className="text-center text-charcoal/60 py-8">
            You haven't created any plans yet. Get started above!
          </p>
        ) : (
          <div className="space-y-3">
            {recentPlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-lg border border-sage/20 p-4 hover:border-sage/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-charcoal">
                      {getPlanTypeLabel(plan.plan_type)}
                    </div>
                    <div className="text-sm text-charcoal/60">
                      {getAudienceLabel(plan.audience)} • {new Date(plan.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      // TODO: Add view plan functionality
                      alert("View plan functionality coming soon!");
                    }}
                    variant="outline"
                    size="sm"
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
