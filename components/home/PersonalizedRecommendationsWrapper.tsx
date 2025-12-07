"use client";

import { useState, useEffect, Suspense } from "react";
import PersonalizedRecommendations from "./PersonalizedRecommendations";
import { isPersonalizationEnabled } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function PersonalizedRecommendationsWrapper() {
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get user ID for personalization
  useEffect(() => {
    if (!isPersonalizationEnabled() || !mounted) return;

    async function getUser() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
      } catch {
        // Silently handle error
      }
    }

    getUser();
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <PersonalizedRecommendations userId={userId} />
    </Suspense>
  );
}

