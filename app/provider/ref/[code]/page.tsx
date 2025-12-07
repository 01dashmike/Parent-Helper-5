import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase.server";
import { cookies } from "next/headers";

type Props = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Join Parent Helper - Referral ${code}`,
    description: "Join Parent Helper and list your baby and toddler classes",
  };
}

export default async function ReferralLandingPage({ params }: Props) {
  const { code } = await params;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return <div>Error loading page</div>;
  }

  // Track click using unified helper with attribution
  const { trackReferralClick } = await import("@/lib/referrals/core");
  
  // Get channel from query params if available (for future use)
  // Note: In a real implementation, you'd extract this from the request URL
  const channel = null; // Can be enhanced to read from searchParams

  const trackResult = await trackReferralClick(code, null, channel, {
    landingPage: "provider_signup",
  });

  if (!trackResult.ok) {
    // If tracking fails, still try to verify the code exists
    const { data: providerRef } = await supabase
      .from("provider_referrals")
      .select("provider_id")
      .eq("referral_code", code)
      .limit(1)
      .maybeSingle();

    if (!providerRef) {
      notFound();
    }
  }

  // Store referral code in cookie for later tracking
  const cookieStore = await cookies();
  cookieStore.set("referral_code", code, {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });

  // Redirect to provider signup/registration
  redirect("/provider/signup?ref=" + code);
}

