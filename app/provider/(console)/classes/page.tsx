import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { getActiveMembershipForUser } from "../../_lib/membership";
import { ClassManager } from "./ClassManager";

// Revalidate every 2 minutes - classes don't change as frequently
export const revalidate = 120;

type RawClass = {
  id: string;
  title: string;
  summary: string | null;
  price: string | null;
  booking_url: string | null;
  is_published: boolean;
  tags: string[] | null;
  venue_id: string | null;
  created_at: string;
  class_occurrences: {
    id: string;
    starts_at: string;
    ends_at: string | null;
    status: string;
    venue_id: string | null;
  }[];
};

type VenueRow = {
  id: string;
  name: string;
  city: string | null;
  postcode: string | null;
};

export default async function ProviderClassesPage() {
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

  const [classesResult, venuesResult] = await Promise.all([
    supabase
      .from("classes")
      .select(
        "id, title, summary, price, booking_url, is_published, tags, venue_id, created_at, class_occurrences ( id, starts_at, ends_at, status, venue_id )"
      )
      .eq("provider_id", providerId)
      .order("created_at", { ascending: true }) as unknown as Promise<{
      data: RawClass[] | null;
      error: any;
    }>,
    supabase
      .from("venues")
      .select("id, name, city, postcode")
      .eq("provider_id", providerId)
      .order("name", { ascending: true }) as unknown as Promise<{
      data: VenueRow[] | null;
      error: any;
    }>,
  ]);

  const classes = classesResult.data ?? [];
  const venues = venuesResult.data ?? [];

  return (
    <div className="space-y-8">
      <ClassManager classes={classes} venues={venues} />
    </div>
  );
}

