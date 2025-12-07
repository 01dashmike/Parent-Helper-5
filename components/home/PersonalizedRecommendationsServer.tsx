import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { isPersonalizationEnabled } from "@/lib/env";
import PersonalizedRecommendations from "./PersonalizedRecommendations";

/**
 * Server component wrapper for PersonalizedRecommendations
 * Fetches user ID server-side instead of client-side
 */
export default async function PersonalizedRecommendationsServer() {
  if (!isPersonalizationEnabled()) {
    return null;
  }

  let userId: string | undefined = undefined;

  try {
    const supabase = createSupabaseServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
    }
  } catch (error) {
    console.error("[PersonalizedRecommendationsServer] Failed to fetch session:", error);
  }

  return <PersonalizedRecommendations userId={userId} />;
}

