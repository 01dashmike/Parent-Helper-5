import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { getActiveMembershipForUser } from "@/app/provider/_lib/membership";
import { getSavedStepData } from "../actions";
import { Step4MediaClient } from "./Step4MediaClient";

export const dynamic = "force-dynamic";

export default async function Step4MediaPage() {
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
  const savedData = await getSavedStepData(providerId, "step-4-media");

  // Get provider metadata for existing logo
  const { data: provider } = await supabase
    .from("providers")
    .select("metadata")
    .eq("id", providerId)
    .single();

  const existingLogoUrl = (provider?.metadata as { logo_url?: string })?.logo_url || "";

  // Get class images if class exists
  const step3Data = await getSavedStepData(providerId, "step-3-class");
  const classId = (step3Data as { classId?: number })?.classId;
  let existingImageUrls: string[] = [];

  if (classId) {
    const { data: classRecord } = await supabase
      .from("classes")
      .select("image_urls")
      .eq("id", classId)
      .single();

    if (classRecord?.image_urls) {
      existingImageUrls = classRecord.image_urls.split(",").filter(Boolean);
    }
  }

  // Pre-fill from saved data, existing DB data, or defaults
  const saved = savedData as { logoUrl?: string; imageUrls?: string[] } | null;
  const initialData = {
    logoUrl: saved?.logoUrl || existingLogoUrl || "",
    imageUrls: saved?.imageUrls || existingImageUrls || [],
  };

  return (
    <Step4MediaClient providerId={providerId} initialData={initialData} />
  );
}

