import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { getActiveMembershipForUser } from "@/app/provider/_lib/membership";
import { getSavedStepData } from "../actions";
import { Step6PublishClient } from "./Step6PublishClient";

export const dynamic = "force-dynamic";

export default async function Step6PublishPage() {
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

  // Get all saved step data for summary
  const step1Data = await getSavedStepData(providerId, "step-1-account");
  const step2Data = await getSavedStepData(providerId, "step-2-business");
  const step3Data = await getSavedStepData(providerId, "step-3-class");
  const step4Data = await getSavedStepData(providerId, "step-4-media");

  // Get provider and class data
  const { data: provider } = await supabase
    .from("providers")
    .select("name, address_line1, town, postcode, metadata")
    .eq("id", providerId)
    .single();

  const classId = (step3Data as { classId?: number })?.classId;
  let classData: {
    name: string | null;
    day_of_week: string | null;
    time: string | null;
    image_urls: string | null;
  } | null = null;
  if (classId) {
    const { data: classRecord } = await supabase
      .from("classes")
      .select("name, day_of_week, time, image_urls")
      .eq("id", classId)
      .single();
    classData = classRecord;
  }

  const summary = {
    providerName: (step2Data as { providerName?: string })?.providerName || provider?.name || "",
    address: `${(step2Data as { addressLine1?: string })?.addressLine1 || provider?.address_line1 || ""}, ${(step2Data as { town?: string })?.town || provider?.town || ""}`,
    className: classData?.name || (step3Data as { className?: string })?.className || "",
    schedule: classData && classData.day_of_week && classData.time
      ? `${classData.day_of_week.charAt(0).toUpperCase() + classData.day_of_week.slice(1)} at ${classData.time}`
      : (step3Data as { dayOfWeek?: string; time?: string })
        ? `${((step3Data as { dayOfWeek?: string }).dayOfWeek || "").charAt(0).toUpperCase() + ((step3Data as { dayOfWeek?: string }).dayOfWeek || "").slice(1)} at ${(step3Data as { time?: string }).time || ""}`
        : "",
    hasLogo: !!(step4Data as { logoUrl?: string })?.logoUrl || !!(provider?.metadata as { logo_url?: string })?.logo_url,
    photoCount: classData?.image_urls
      ? classData.image_urls.split(",").filter(Boolean).length
      : ((step4Data as { imageUrls?: string[] })?.imageUrls || []).length,
  };

  return (
    <Step6PublishClient providerId={providerId} summary={summary} />
  );
}


