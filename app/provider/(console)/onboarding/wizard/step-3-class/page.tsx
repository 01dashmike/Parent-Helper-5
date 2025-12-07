import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { getActiveMembershipForUser } from "@/app/provider/_lib/membership";
import { getSavedStepData } from "../actions";
import { Step3ClassClient } from "./Step3ClassClient";

export const dynamic = "force-dynamic";

export default async function Step3ClassPage() {
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
  const savedData = await getSavedStepData(providerId, "step-3-class");

  // Pre-fill from saved data or defaults
  const initialData: Partial<{
    className: string;
    description: string;
    ageGroupMin: number;
    ageGroupMax: number;
    category: string;
    venue: string;
    dayOfWeek: string;
    time: string;
    price: string;
  }> = savedData
    ? (savedData as Record<string, any>)
    : {
        className: "",
        description: "",
        ageGroupMin: 0,
        ageGroupMax: 24,
        category: "",
        venue: "",
        dayOfWeek: "",
        time: "",
        price: "",
      };

  return (
    <Step3ClassClient providerId={providerId} initialData={initialData} />
  );
}

