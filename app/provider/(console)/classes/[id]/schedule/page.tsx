import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { getActiveMembershipForUser } from "../../../../_lib/membership";
import { isBulkSchedulingEnabled } from "@/lib/env";
import BulkSchedulingClient from "./BulkSchedulingClient";
import { Breadcrumb } from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "Schedule Class | Provider Console",
  description: "Create repeated class occurrences quickly",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SchedulePage({ params }: PageProps) {
  if (!isBulkSchedulingEnabled()) {
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

  const membership = await getActiveMembershipForUser(supabase, user.id);
  if (!membership?.providers) {
    redirect("/provider/login");
  }

  // Fetch class details
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("id, name, provider_id")
    .eq("id", classId)
    .single();

  if (classError || !classData || classData.provider_id !== membership.provider_id) {
    redirect("/provider/classes");
  }

  // Fetch existing occurrences for this class
  const { data: existingOccurrences } = await supabase
    .from("class_occurrences")
    .select("id, start_at, end_at, capacity, price_cents")
    .eq("class_id", classId)
    .order("start_at", { ascending: true });

  return (
    <div className="space-y-6">
      <Breadcrumb 
        items={[
          { label: "Home", href: "/" },
          { label: "Provider", href: "/provider" },
          { label: "Classes", href: "/provider/classes" },
          { label: classData.name, href: `/provider/classes/${id}` },
          { label: "Schedule" }
        ]}
        className="mb-4"
      />
      <div>
        <h1 className="text-2xl font-semibold text-charcoal">Schedule Class</h1>
        <p className="mt-1 text-sm text-charcoal/70">{classData.name}</p>
      </div>

      <BulkSchedulingClient
        classId={classId}
        className={classData.name}
        existingOccurrences={existingOccurrences || []}
      />
    </div>
  );
}

