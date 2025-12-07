import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { getActiveMembershipForUser } from "../../_lib/membership";
import VerificationForm from "@/components/provider/VerificationForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProviderVerificationPage() {
  const supabase = createSupabaseServerComponentClient();
  const { data, error } = await supabase.auth.getSession();
  const session = data?.session ?? null;

  if (!session?.user) {
    redirect("/provider/login");
  }

  const membership = await getActiveMembershipForUser(supabase, session.user.id);
  
  if (!membership?.providers) {
    return (
      <div className="min-h-screen bg-cream px-4 py-10 text-charcoal">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-sage/20 bg-white p-8 text-center">
            <h1 className="text-2xl font-semibold text-charcoal">No Provider Account</h1>
            <p className="mt-4 text-charcoal/70">
              You need to have an active provider account to access verification.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-4xl">
        <VerificationForm providerId={membership.provider_id} />
      </div>
    </div>
  );
}

