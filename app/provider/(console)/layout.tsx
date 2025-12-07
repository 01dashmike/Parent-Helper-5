import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { ProviderShell } from "./_components/ProviderShell";
import { signOutAction } from "../(auth)/actions";
import { getActiveMembershipForUser } from "../_lib/membership";
import { ErrorBoundaryWrapper } from "@/components/layout/ErrorBoundaryWrapper";

export const dynamic = "force-dynamic";

export default async function ProviderConsoleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = createSupabaseServerComponentClient();
  const { data, error } = await supabase.auth.getSession();
  const session = data?.session ?? null;

  if (error) {
    console.error("[ProviderConsoleLayout] Session error:", error.message);
    redirect("/provider/login");
  }

  if (!session?.user) {
    redirect("/provider/login");
  }

  const membershipRow = await getActiveMembershipForUser(supabase, session.user.id);

  if (!membershipRow || !membershipRow.providers) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream/30 px-6">
        <div className="max-w-md space-y-4 rounded-2xl border border-terracotta/40 bg-white/90 p-6 text-center shadow-lg">
          <h1 className="text-xl font-semibold text-charcoal">Access pending</h1>
          <p className="text-sm text-charcoal/70">
            Your account is signed in, but we couldn't find an active provider assignment yet. If
            you're expecting access, please contact your Parent Helper success manager.
          </p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-md border border-terracotta/50 px-4 py-2 text-sm font-medium text-terracotta transition hover:bg-terracotta/10"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }

  const providerId = membershipRow.provider_id;

  // Check onboarding status - redirect to wizard if incomplete
  // Only redirect from /provider root, not from wizard routes themselves
  // This prevents infinite redirect loops
  // Note: provider_onboarding.provider_id may be UUID, so we handle errors gracefully
  const { data: onboarding, error: onboardingError } = await supabase
    .from("provider_onboarding")
    .select("is_complete, current_step")
    .eq("provider_id", providerId)
    .maybeSingle();

  if (onboardingError) {
    console.error("[ProviderConsoleLayout] Error querying provider_onboarding:", {
      error: onboardingError.message,
      code: onboardingError.code,
      providerId,
      providerIdType: typeof providerId,
    });
    // Continue rendering - let page.tsx handle onboarding check
  }

  // If onboarding is not complete and we're not already in the onboarding/wizard routes,
  // redirect to wizard (but only check this for the root /provider route)
  // We'll handle this check in the page.tsx instead to avoid layout-level redirects

  return (
    <ErrorBoundaryWrapper>
      <ProviderShell
        session={{
          provider: {
            id: membershipRow.providers.id,
            name: membershipRow.providers.name,
            slug: membershipRow.providers.slug,
          },
          membership: {
            role: membershipRow.role,
            status: membershipRow.status,
          },
          user: {
            id: session.user.id,
            email: session.user.email ?? null,
          },
        }}
      >
        {children}
      </ProviderShell>
    </ErrorBoundaryWrapper>
  );
}

