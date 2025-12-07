import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { getActiveMembershipForUser } from "../../_lib/membership";
import { VenueManager } from "./VenueManager";

// Revalidate every 5 minutes - venues don't change frequently
export const revalidate = 300;

type VenueRow = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  county: string | null;
  postcode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
};

export default async function ProviderVenuesPage() {
  const supabase = createSupabaseServerComponentClient();
  const { data, error } = await supabase.auth.getSession();
  const session = data?.session ?? null;

  if (!session?.user) {
    redirect("/provider/login");
  }

  const membership = await getActiveMembershipForUser(supabase, session.user.id);
  if (!membership?.providers) {
    redirect("/provider/login");
  }

  const providerId = membership.provider_id;

  const { data: venuesData } = await supabase
    .from("venues")
    .select("*")
    .eq("provider_id", providerId)
    .order("name", { ascending: true })
    .returns<VenueRow[]>();

  const venues: VenueRow[] = Array.isArray(venuesData)
    ? (venuesData as VenueRow[])
    : [];

  return (
    <div className="space-y-8">
      <VenueManager venues={venues} />
    </div>
  );
}

