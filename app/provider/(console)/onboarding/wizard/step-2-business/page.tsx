import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { getActiveMembershipForUser } from "@/app/provider/_lib/membership";
import { getSavedStepData } from "../actions";
import { Step2BusinessClient } from "./Step2BusinessClient";

export const dynamic = "force-dynamic";

export default async function Step2BusinessPage() {
  const supabase = createSupabaseServerComponentClient();
  const { data } = await supabase.auth.getSession();
  const session = data?.session ?? null;

  if (!session?.user) {
    redirect("/provider/login");
  }

  const membershipRow = await getActiveMembershipForUser(supabase, session.user.id);

  if (!membershipRow || !membershipRow.providers) {
    redirect("/provider/login");
  }

  const providerId = membershipRow.provider_id;
  const savedData = await getSavedStepData(providerId, "step-2-business");

  // Get provider data
  const { data: provider } = await supabase
    .from("providers")
    .select("name, address_line1, address_line2, town, county, postcode, metadata")
    .eq("id", providerId)
    .single();

  // Pre-fill from saved data or provider record
  const initialData: Partial<{
    providerName: string;
    addressLine1: string;
    addressLine2: string;
    town: string;
    county: string;
    postcode: string;
    category: string;
  }> = savedData
    ? (savedData as Record<string, any>)
    : {
        providerName: provider?.name || "",
        addressLine1: provider?.address_line1 || "",
        addressLine2: provider?.address_line2 || "",
        town: provider?.town || "",
        county: provider?.county || "",
        postcode: provider?.postcode || "",
        category: (provider?.metadata as { category?: string })?.category || "",
      };

  return (
    <Step2BusinessClient providerId={providerId} initialData={initialData} />
  );
}

