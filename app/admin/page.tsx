import { Metadata } from "next";
import Link from "next/link";
import { requireAdminServerComponent } from "@/lib/admin/auth-improved";
import { createSupabaseServerComponentClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Admin Dashboard | Parent Helper",
  description: "Parent Helper admin console",
  robots: "noindex, nofollow",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdminServerComponent();
  
  const supabase = createSupabaseServerComponentClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;

  return (
    <div className="min-h-screen bg-cream px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
          <p className="text-slateSoft text-sm">
            Welcome to the Parent Helper admin console
            {user?.email && (
              <span className="ml-2">({user.email})</span>
            )}
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Blog Management Card */}
          <Link
            href="/admin/blogs"
            className="group rounded-2xl border border-sage/30 bg-white p-6 shadow-soft transition-all duration-200 hover:border-sage/50 hover:shadow-md"
          >
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-charcoal group-hover:text-sage transition-colors">
                Blog Management
              </h2>
              <p className="text-sm text-charcoal/70">
                Review AI-generated drafts, tweak metadata, and approve blog posts for parents.
              </p>
              <div className="pt-2">
                <span className="text-xs font-medium text-sage group-hover:underline">
                  Manage blogs →
                </span>
              </div>
            </div>
          </Link>

          {/* About Page Editor Card */}
          <Link
            href="/admin/about"
            className="group rounded-2xl border border-sage/30 bg-white p-6 shadow-soft transition-all duration-200 hover:border-sage/50 hover:shadow-md"
          >
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-charcoal group-hover:text-sage transition-colors">
                About Page Editor
              </h2>
              <p className="text-sm text-charcoal/70">
                Edit the content and images for the About Parent Helper page.
              </p>
              <div className="pt-2">
                <span className="text-xs font-medium text-sage group-hover:underline">
                  Edit about page →
                </span>
              </div>
            </div>
          </Link>

          {/* Analytics Insights Card */}
          <Link
            href="/admin/insights"
            className="group rounded-2xl border border-sage/30 bg-white p-6 shadow-soft transition-all duration-200 hover:border-sage/50 hover:shadow-md"
          >
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-charcoal group-hover:text-sage transition-colors">
                Analytics Insights
              </h2>
              <p className="text-sm text-charcoal/70">
                View anonymized usage analytics and insights from the last 30 days.
              </p>
              <div className="pt-2">
                <span className="text-xs font-medium text-sage group-hover:underline">
                  View insights →
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions Section */}
        <section className="mt-8 rounded-2xl border border-sage/30 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-charcoal mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/blogs"
              className="rounded-lg bg-sage/10 px-4 py-2 text-sm font-medium text-sage hover:bg-sage/20 transition-colors"
            >
              Manage Blogs
            </Link>
            <Link
              href="/admin/about"
              className="rounded-lg bg-sage/10 px-4 py-2 text-sm font-medium text-sage hover:bg-sage/20 transition-colors"
            >
              Edit About Page
            </Link>
            <Link
              href="/admin/insights"
              className="rounded-lg bg-sage/10 px-4 py-2 text-sm font-medium text-sage hover:bg-sage/20 transition-colors"
            >
              View Analytics
            </Link>
            <Link
              href="/"
              className="rounded-lg bg-charcoal/10 px-4 py-2 text-sm font-medium text-charcoal hover:bg-charcoal/20 transition-colors"
            >
              View Site
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
