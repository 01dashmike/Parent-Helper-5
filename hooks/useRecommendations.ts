"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { RecommendationResult } from "@/app/api/recommendations/route";

export type ChildProfile = {
  age: number;
  interests?: string[];
  name?: string;
};

export type RecommendationsLocation = {
  town?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
};

export type UseRecommendationsOptions = {
  userId?: string;
  childProfiles?: ChildProfile[];
  location?: RecommendationsLocation;
  enabled?: boolean;
};

export type UseRecommendationsResult = {
  recommendations: RecommendationResult[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export type AsyncError = {
  message: string;
  code?: string;
  status?: number;
};

/**
 * useRecommendations Hook
 * 
 * Fetches personalized class recommendations for a user.
 * 
 * @param options - Configuration options
 * @returns Recommendations data, loading state, error, and refetch function
 * 
 * @example
 * ```tsx
 * const { recommendations, loading, error } = useRecommendations({
 *   userId: user.id,
 *   childProfiles: [{ age: 5, name: "Emma" }],
 *   location: { town: "London" }
 * });
 * ```
 */
export function useRecommendations(
  options: UseRecommendationsOptions = {}
): UseRecommendationsResult {
  const {
    userId,
    childProfiles,
    location,
    enabled = true,
  } = options;

  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const normalizeError = useCallback((err: unknown): AsyncError => {
    if (err instanceof Error) {
      return {
        message: err.message,
        code: err.name,
      };
    }
    if (typeof err === "object" && err !== null && "message" in err) {
      return {
        message: String(err.message),
        code: "error" in err ? String(err.error) : undefined,
      };
    }
    return {
      message: String(err) || "An unknown error occurred",
    };
  }, []);

  const fetchRecommendations = useCallback(async () => {
    if (!enabled) {
      if (isMountedRef.current) {
        setLoading(false);
      }
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }

      // Build query parameters
      const searchParams = new URLSearchParams();
      
      if (userId) {
        searchParams.set("user_id", userId);
      }
      
      if (childProfiles && childProfiles.length > 0) {
        searchParams.set("child_profiles", JSON.stringify(childProfiles));
      }
      
      if (location) {
        if (location.town) {
          searchParams.set("town", location.town);
        }
        if (location.postcode) {
          searchParams.set("postcode", location.postcode);
        }
        if (location.latitude !== undefined) {
          searchParams.set("latitude", location.latitude.toString());
        }
        if (location.longitude !== undefined) {
          searchParams.set("longitude", location.longitude.toString());
        }
      }

      // If no child profiles provided, try to get from user's family members
      if (!childProfiles && userId && !abortController.signal.aborted) {
        try {
          const supabase = createSupabaseBrowserClient();
          const { data: familyMembers } = await supabase
            .from("family_members")
            .select("age, name")
            .eq("user_id", userId)
            .abortSignal(abortController.signal);
          
          if (abortController.signal.aborted || !isMountedRef.current) return;
          
          if (familyMembers && familyMembers.length > 0) {
            const profiles: ChildProfile[] = familyMembers.map((member) => ({
              age: member.age || 5,
              name: member.name || undefined,
            }));
            searchParams.set("child_profiles", JSON.stringify(profiles));
          }
        } catch (err) {
          if (abortController.signal.aborted || !isMountedRef.current) return;
          // Supabase client creation failed - continue without child profiles
          console.warn("[useRecommendations] Failed to get child profiles:", err);
        }
      }

      if (abortController.signal.aborted || !isMountedRef.current) return;

      const url = `/api/recommendations${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      const response = await fetch(url, {
        signal: abortController.signal,
      });

      if (abortController.signal.aborted || !isMountedRef.current) return;

      if (!response.ok) {
        if (response.status === 401) {
          // User not logged in - that's OK
          if (isMountedRef.current) {
            setRecommendations([]);
            setLoading(false);
          }
          return;
        }
        const normalizedError = normalizeError({
          message: `Failed to fetch recommendations: ${response.statusText}`,
          status: response.status,
        });
        throw normalizedError;
      }

      const data = await response.json();
      
      if (abortController.signal.aborted || !isMountedRef.current) return;
      
      if (isMountedRef.current) {
        setRecommendations(data.recommendations || []);
      }
    } catch (err: unknown) {
      if (abortController.signal.aborted || !isMountedRef.current) return;
      
      const normalizedError = normalizeError(err);
      console.error("[useRecommendations] Error:", normalizedError);
      
      if (isMountedRef.current) {
        setError(normalizedError.message);
        setRecommendations([]);
      }
    } finally {
      if (isMountedRef.current && !abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [enabled, userId, childProfiles, location, normalizeError]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchRecommendations();

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchRecommendations]);

  const refetch = useCallback(async () => {
    await fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    refetch,
  };
}

