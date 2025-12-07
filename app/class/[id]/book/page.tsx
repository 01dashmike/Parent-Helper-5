import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import BookPageClient from "./BookPageClient";
import { getSessionsForClass } from "./actions";

// Revalidate every 2 minutes - booking availability changes frequently
export const revalidate = 120;

type BookPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string; sessionId?: string }>;
};

export default async function BookPage({ params, searchParams }: BookPageProps) {
  const { id } = await params;
  const { step, sessionId } = await searchParams;
  const classId = parseInt(id, 10);

  if (isNaN(classId)) {
    redirect("/");
  }

  const supabase = createServerClient();

  // Parallelize all data fetching for better performance
  const [
    classResult,
    settingsResult,
    sessions,
    userResult,
    upsellsResult,
  ] = await Promise.all([
    supabase
      .from("classes")
      .select(
        `
        *,
        providers (
          id,
          name,
          email,
          phone
        )
      `
      )
      .eq("id", classId)
      .eq("is_active", true)
      .single(),
    supabase
      .from("provider_booking_settings")
      .select("*")
      .eq("provider_id", classId) // Note: This will be fixed with actual provider_id after classData is fetched
      .or(`class_id.is.null,class_id.eq.${classId}`)
      .order("class_id", { ascending: false, nullsFirst: false })
      .limit(1)
      .single(),
    getSessionsForClass(classId),
    supabase.auth.getUser(),
    // Fetch upsells - will be refined after getting provider_id
    Promise.resolve({ data: null }), // Placeholder
  ]);

  const { data: classData, error: classError } = classResult;

  if (classError || !classData) {
    redirect("/");
  }

  // Now fetch settings and upsells with the correct provider_id in parallel
  const [actualSettings, actualUpsells] = await Promise.all([
    settingsResult.data
      ? Promise.resolve(settingsResult)
      : supabase
          .from("provider_booking_settings")
          .select("*")
          .eq("provider_id", classData.provider_id)
          .or(`class_id.is.null,class_id.eq.${classId}`)
          .order("class_id", { ascending: false, nullsFirst: false })
          .limit(1)
          .single(),
    supabase
      .from("upsells")
      .select("*")
      .eq("provider_id", classData.provider_id)
      .or(`class_id.is.null,class_id.eq.${classId}`)
      .eq("is_enabled", true)
      .order("display_order", { ascending: true }),
  ]);

  return (
    <BookPageClient
      classData={{
        id: classData.id,
        name: classData.name || "",
        description: classData.description || "",
        category: classData.category || "",
        town: classData.town || "",
        venue: classData.venue || "",
        address: classData.address || "",
        ageGroupMin: classData.age_group_min || 0,
        ageGroupMax: classData.age_group_max || 999,
        price: classData.price || "Free",
        providerId: classData.provider_id || 0,
        providerName: (classData.providers as any)?.name || "",
      }}
      settings={actualSettings.data || undefined}
      initialSessions={sessions || []}
      initialUpsells={(actualUpsells.data || []).map((u: { id: number; title: string; description?: string | null; price?: number | string | null; type: string; metadata?: Record<string, any> | null }) => ({
        id: u.id,
        title: u.title,
        description: u.description || "",
        price: parseFloat(u.price?.toString() || "0"),
        type: u.type as "block_upgrade" | "add_on" | "subscription_offer",
        metadata: (u.metadata as Record<string, any>) || {},
      }))}
      initialStep={(step as any) || "select_session"}
      initialSessionId={sessionId ? parseInt(sessionId, 10) : undefined}
      userId={userResult.data?.user?.id}
    />
  );
}

