import { Metadata } from "next";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import OccurrencesManager from "./OccurrencesManager";
import { Breadcrumb } from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "Manage Occurrences | Provider Console",
  description: "Manage booking availability and Stripe Payment Links for class occurrences",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OccurrencesPage({ params }: PageProps) {
  if (process.env.FEATURE_BOOKINGS !== "true") {
    redirect("/provider/classes");
  }

  const { id } = await params;
  const classId = Number.parseInt(id, 10);

  if (Number.isNaN(classId)) {
    redirect("/provider/classes");
  }

  const supabase = createSupabaseServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/provider/login");
  }

  // Fetch class with sessions and instances
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select(
      `
      id,
      name,
      provider_id,
      class_sessions(
        id,
        title,
        weekday,
        start_time,
        end_time,
        session_instances(
          id,
          starts_at,
          ends_at,
          status,
          bookable,
          stripe_payment_link_url,
          capacity,
          available_spots
        )
      )
    `
    )
    .eq("id", classId)
    .single();

  if (classError || !classData) {
    redirect("/provider/classes");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumb 
        items={[
          { label: "Home", href: "/" },
          { label: "Provider", href: "/provider" },
          { label: "Classes", href: "/provider/classes" },
          { label: classData.name, href: `/provider/classes/${id}` },
          { label: "Occurrences" }
        ]}
        className="mb-6"
      />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-charcoal">Manage Occurrences</h1>
        <p className="mt-1 text-sm text-charcoal/70">
          {classData.name} — Enable bookings and add Stripe Payment Links
        </p>
      </div>

      <OccurrencesManager classId={classId} sessions={classData.class_sessions || []} />
    </div>
  );
}

