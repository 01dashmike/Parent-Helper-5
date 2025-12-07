import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { getSupabaseServer } from "@/lib/supabase.server";
import { AdminLoginForm } from "./_components/AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const supabase = createSupabaseServerComponentClient();
  const { data, error } = await supabase.auth.getSession();
  const session = data?.session ?? null;

  // If already logged in and is admin, redirect to admin dashboard
  if (session?.user) {
    const serverSupabase = getSupabaseServer();
    if (serverSupabase) {
      const { data: userData } = await serverSupabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (userData?.role === "admin") {
        redirect("/admin");
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-charcoal">Admin Login</h1>
          <p className="mt-2 text-sm text-charcoal/70">
            Sign in to access the admin console
          </p>
        </div>
        <div className="rounded-lg border border-sage/30 bg-white p-6">
          <AdminLoginForm />
          <div className="mt-4 pt-4 border-t border-sage/20">
            <p className="text-xs text-charcoal/60">
              <strong>Note:</strong> In development, you can set DEV_ADMIN_EMAIL in your .env file to bypass role checks.
            </p>
            <p className="text-xs text-charcoal/60 mt-2">
              Run <code className="bg-cream px-1 py-0.5 rounded">node scripts/seed-admin-test-data.mjs</code> to create a test admin account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
