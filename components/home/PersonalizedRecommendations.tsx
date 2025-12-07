"use client";

import { useState, useEffect, useMemo, memo } from "react";

import { CardBody, CardContainer } from "@/components/cards";
import { Info } from "@/components/icons";
import SafeBoundary from "@/components/system/SafeBoundary";
import { EmptyState } from "@/components/ui/emptystate";
import { ErrorState } from "@/components/ui/errorstate";
import LinkComponent from "@/components/ui/link";
import { announce } from "@/lib/a11y/announce";
import { isPersonalizationEnabled } from "@/lib/env";
import { reportError } from "@/lib/errorReporter";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { PersonalizationResult, PersonalizedClass } from "@/lib/types/personalization";

interface PersonalizedRecommendationsProps {
  userId?: string;
}

async function requestPersonalizedRecommendations(userId: string): Promise<PersonalizedClass[]> {
  const response = await fetch("/api/personalization/recommendations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to personalize (${response.status})`);
  }

  const payload = (await response.json()) as { data: PersonalizationResult | null };
  return payload?.data?.classes ?? [];
}

const PersonalizedRecommendations = memo(function PersonalizedRecommendations({ userId }: PersonalizedRecommendationsProps): React.ReactNode {
  const [recommendations, setRecommendations] = useState<PersonalizedClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChildProfiles, setHasChildProfiles] = useState<boolean | null>(null);

  // Check for child profiles
  useEffect(() => {
    if (!isPersonalizationEnabled()) return;
    if (!userId) return;

    async function checkProfiles() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: familyMembers } = await supabase
          .from("family_members")
          .select("id")
          .eq("user_id", userId)
          .limit(1);
        
        setHasChildProfiles((familyMembers?.length || 0) > 0);
      } catch {
        // Silently handle error
      }
    }

    checkProfiles();
  }, [userId]);

  // Fetch personalized recommendations
  useEffect(() => {
    if (!isPersonalizationEnabled()) {
      setLoading(false);
      return;
    }

    if (!userId) {
      setLoading(false);
      return;
    }

    const resolvedUserId = userId;

    let cancelled = false;

    async function fetchPersonalized() {
      try {
        setLoading(true);
        setError(null);

        const result = await requestPersonalizedRecommendations(resolvedUserId);

        if (cancelled) return;

        if (result.length > 0) {
          setRecommendations(result);
          announce(`Loaded ${result.length} personalized ${result.length === 1 ? "recommendation" : "recommendations"}`);
        } else {
          // Safe fallback: empty recommendations
          setRecommendations([]);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        reportError(err instanceof Error ? err : new Error(err?.message || "Unknown personalization error"), {
          component: "PersonalizedRecommendations",
        });
        setError(err?.message || "Failed to load recommendations");
        setRecommendations([]); // Safe fallback: empty array
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPersonalized();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Top 3 recommendations for display (memoize before early returns)
  const topRecommendations = useMemo(() => recommendations.slice(0, 3), [recommendations]);

  // Early return if personalization is disabled (after all hooks)
  if (!isPersonalizationEnabled()) {
    return null;
  }

  // Loading skeleton
  if (loading) {
    return (
      <SafeBoundary name="PersonalizedRecommendations" fallback={null}>
        <div className="section-container">
          <div className="section-block">
            <h2 className="section-title">
              Recommended for your family
            </h2>
            <p className="section-description">
              Classes personalized based on your children&apos;s ages and interests
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="status" aria-live="polite" aria-label="Loading personalized recommendations" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton-card p-section"
                aria-hidden="true"
              >
                <div className="mb-sm h-6 w-3/4 skeleton"></div>
                <div className="mb-sm h-4 w-full skeleton"></div>
                <div className="mb-sm h-4 w-2/3 skeleton"></div>
                <div className="h-3 w-1/2 skeleton"></div>
              </div>
            ))}
            </div>
          </div>
        </div>
      </SafeBoundary>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeBoundary name="PersonalizedRecommendations" fallback={null}>
        <div className="section-container">
          <div className="section-block">
            <h2 className="section-title">
              Recommended for your family
            </h2>
            <p className="section-description">
              Classes personalized based on your children&apos;s ages and interests
            </p>
            <ErrorState
            title="Unable to load recommendations"
            message={error}
            onRetry={() => {
              if (!userId) {
                setError("Sign in to personalize");
                setRecommendations([]);
                setLoading(false);
                return;
              }
              setError(null);
              setLoading(true);
              // Trigger refetch
              const fetchPersonalized = async () => {
                try {
                  const resolvedUserId = userId;
                  const result = await requestPersonalizedRecommendations(resolvedUserId);
                  if (result.length > 0) {
                    setRecommendations(result);
                  } else {
                    setRecommendations([]);
                  }
                } catch (err: unknown) {
                  reportError(err instanceof Error ? err : new Error(err?.message || "Unknown personalization error"), {
                    component: "PersonalizedRecommendations",
                    retry: true,
                  });
                  setError(err?.message || "Failed to load recommendations");
                  setRecommendations([]);
                } finally {
                  setLoading(false);
                }
              };
              fetchPersonalized();
            }}
            retryLabel="Try again"
            isDynamic={true}
          />
          </div>
        </div>
      </SafeBoundary>
    );
  }

  // Empty state
  if (recommendations.length === 0) {
    return (
      <SafeBoundary name="PersonalizedRecommendations" fallback={null}>
        <div className="section-container">
          <div className="section-block">
            <h2 className="section-title">
              Recommended for your family
            </h2>
            <p className="section-description">
              Classes personalized based on your children&apos;s ages and interests
            </p>
            <EmptyState
            title="No recommendations found"
            description={hasChildProfiles === false
              ? "Add your children's profiles to get personalized class recommendations."
              : "We couldn't find any classes matching your preferences right now. Try adjusting your search filters."}
            iconVariant="inbox"
            actionLabel={hasChildProfiles === false ? "Improve your recommendations" : undefined}
            actionHref={hasChildProfiles === false ? "/family" : undefined}
            size="default"
          />
          </div>
        </div>
      </SafeBoundary>
    );
  }

  return (
      <SafeBoundary name="PersonalizedRecommendations" fallback={null}>
        <div className="section-container">
          <div className="section-block">
            <h2 className="section-title">
              Recommended for your family
            </h2>
            <p className="section-description">
              Classes personalized based on your children&apos;s ages and interests
            </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-live="polite" aria-atomic="true">
          {topRecommendations.map((rec) => (
            <CardContainer
              key={rec.id}
              as={LinkComponent}
              href={`/class/${rec.id}`}
              interactive
              ariaLabel={`View ${rec.title} class details`}
              className="h-full"
              prefetch={false}
            >
              <CardBody>
                <div className="mb-sm flex items-start justify-between">
                  <h3 className="font-semibold text-charcoal group-hover:text-blue-600 truncate" lang="en">
                    {rec.title}
                  </h3>
                  {rec.score > 0.7 && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-small font-medium text-green-800">
                      Top Match
                    </span>
                  )}
                </div>
                <p className="mb-sm line-clamp-2 text-small text-charcoal" lang="en">
                  {rec.description || "No description available"}
                </p>
                <div className="mb-sm flex items-center gap-2 text-small text-slateSoft">
                  {rec.category && <span>{rec.category}</span>}
                  {rec.category && rec.town && <span>•</span>}
                  {rec.town && <span>{rec.town}</span>}
                  {rec.age_range && (
                    <>
                      {(rec.category || rec.town) && <span>•</span>}
                      <span>Ages {rec.age_range}</span>
                    </>
                  )}
                </div>
                
                {/* Why recommended tooltip/tag */}
                {rec.rationale && (
                  <div className="mt-sm group/why relative inline-block">
                    <div
                      className="text-small text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-help"
                      aria-label={`Why recommended: ${rec.rationale}`}
                    >
                      <span>Why recommended?</span>
                      <Info size={12} className="w-3 h-3" />
                    </div>
                    <div className="absolute bottom-full left-0 mb-sm hidden group-hover/why:block z-10 w-64 rounded-lg bg-charcoal px-3 py-sm text-small text-white shadow-lg pointer-events-none">
                      <div className="font-medium mb-xs">Why recommended:</div>
                      <div className="text-white/70">{rec.rationale}</div>
                      <div className="absolute top-full left-4 -mt-1 h-2 w-2 rotate-45 bg-charcoal"></div>
                    </div>
                  </div>
                )}
              </CardBody>
            </CardContainer>
          ))}
        </div>

        <div className="mt-lg text-center">
          <LinkComponent
            href="/family"
            className="text-body text-blue-600 hover:underline"
            prefetch={false}
          >
            Manage family profile →
          </LinkComponent>
          {hasChildProfiles === false && (
            <span className="mx-2 text-slateSoft">•</span>
          )}
          {hasChildProfiles === false && (
            <LinkComponent
              href="/family"
              className="text-body text-blue-600 hover:underline font-medium"
              prefetch={false}
            >
              Improve your recommendations
            </LinkComponent>
          )}
          </div>
        </div>
      </div>
      </SafeBoundary>
  );
});

PersonalizedRecommendations.displayName = "PersonalizedRecommendations";

export default PersonalizedRecommendations;

