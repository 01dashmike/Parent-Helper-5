// app/provider/(auth)/login/page.tsx

import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { LoginForm } from "../_components/LoginForm";

export const dynamic = "force-dynamic";

export default async function ProviderLoginPage() {
  const supabase = createSupabaseServerComponentClient();
  const { data, error } = await supabase.auth.getSession();
  const session = data?.session ?? null;

  // If already logged in, redirect to provider console
  if (session?.user) {
    redirect("/provider");
  }

  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-[70vh] px-4 pt-24 pb-16 flex items-start justify-center">
      {/* On very small screens the card will start below the header */}
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-charcoal">Provider Login</h1>
          <p className="mt-2 text-sm text-charcoal/70">
            Sign in to access the provider console
          </p>
        </div>
        <div className="rounded-lg border border-sage/30 bg-white p-6">
          <LoginForm />
          {isDevelopment && (
            <div className="mt-4 pt-4 border-t border-sage/20">
              <p className="text-xs text-charcoal/60">
                <strong>Development Mode:</strong> Password login is available. Use the seeded test account:
              </p>
              <p className="text-xs text-charcoal/60 mt-1">
                Email: <code className="bg-cream px-1 py-0.5 rounded">provider-test@parenthelper.co.uk</code>
              </p>
              <p className="text-xs text-charcoal/60 mt-1">
                Password: <code className="bg-cream px-1 py-0.5 rounded">TestProvider123!</code>
              </p>
              <p className="text-xs text-charcoal/60 mt-2">
                Run <code className="bg-cream px-1 py-0.5 rounded">node scripts/seed-provider-test-data.mjs</code> to create the test provider account.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
