import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { getActiveMembershipForUser } from "@/app/provider/_lib/membership";
import { getSavedStepData } from "../actions";
import { Step5PreviewClient } from "./Step5PreviewClient";

export const dynamic = "force-dynamic";

export default async function Step5PreviewPage() {
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

  // Get all saved step data
  const step1Data = await getSavedStepData(providerId, "step-1-account");
  const step2Data = await getSavedStepData(providerId, "step-2-business");
  const step3Data = await getSavedStepData(providerId, "step-3-class");

  // Get provider data as fallback
  const { data: provider } = await supabase
    .from("providers")
    .select("name, contact_email, contact_phone, address_line1, town, postcode, metadata")
    .eq("id", providerId)
    .single();

  // Get class data if it exists
  const classId = (step3Data as { classId?: number })?.classId;
  let classData: {
    name: string | null;
    description: string | null;
    category: string | null;
    age_group_min: number | null;
    age_group_max: number | null;
    venue: string | null;
    day_of_week: string | null;
    time: string | null;
    price: string | null;
    image_urls: string | null;
  } | null = null;
  if (classId) {
    const { data: classRecord } = await supabase
      .from("classes")
      .select("name, description, category, age_group_min, age_group_max, venue, day_of_week, time, price, image_urls")
      .eq("id", classId)
      .single();
    classData = classRecord;
  }

  // Get media data
  const step4Data = await getSavedStepData(providerId, "step-4-media");
  const mediaData = step4Data as { logoUrl?: string; imageUrls?: string[] } | null;

  // Build preview data from saved steps or DB
  const providerData = {
    name: (step2Data as { providerName?: string })?.providerName || provider?.name || "",
    contactEmail: (step1Data as { email?: string })?.email || provider?.contact_email || "",
    contactPhone: (step1Data as { phone?: string })?.phone || provider?.contact_phone || "",
    addressLine1: (step2Data as { addressLine1?: string })?.addressLine1 || provider?.address_line1 || "",
    town: (step2Data as { town?: string })?.town || provider?.town || "",
    postcode: (step2Data as { postcode?: string })?.postcode || provider?.postcode || "",
    logoUrl: mediaData?.logoUrl || (provider?.metadata as { logo_url?: string })?.logo_url || "",
  };

  const step3 = step3Data as {
    className?: string;
    description?: string;
    category?: string;
    ageGroupMin?: number;
    ageGroupMax?: number;
    venue?: string;
    dayOfWeek?: string;
    time?: string;
    price?: string;
  } | null;

  const previewClassData = classData
    ? {
        name: classData.name || "",
        description: classData.description || "",
        category: classData.category || "",
        ageGroupMin: classData.age_group_min ?? 0,
        ageGroupMax: classData.age_group_max ?? 24,
        venue: classData.venue || "",
        dayOfWeek: classData.day_of_week || "",
        time: classData.time || "",
        price: classData.price || "",
        town: provider?.town || (step2Data as { town?: string })?.town || "",
        imageUrls: classData.image_urls
          ? classData.image_urls.split(",").filter(Boolean)
          : mediaData?.imageUrls || [],
      }
    : step3
      ? {
          name: step3.className || "",
          description: step3.description || "",
          category: step3.category || "",
          ageGroupMin: step3.ageGroupMin || 0,
          ageGroupMax: step3.ageGroupMax || 24,
          venue: step3.venue || "",
          dayOfWeek: step3.dayOfWeek || "",
          time: step3.time || "",
          price: step3.price || "",
          town: provider?.town || (step2Data as { town?: string })?.town || "",
          imageUrls: mediaData?.imageUrls || [],
        }
      : {
          name: "",
          description: "",
          category: "",
          ageGroupMin: 0,
          ageGroupMax: 24,
          venue: "",
          dayOfWeek: "",
          time: "",
          price: "",
          town: provider?.town || "",
          imageUrls: mediaData?.imageUrls || [],
        };

  return (
    <Step5PreviewClient
      providerId={providerId}
      providerData={providerData}
      classData={previewClassData}
    />
  );
}


