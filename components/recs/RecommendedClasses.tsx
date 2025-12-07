"use client";

import { useState, useEffect } from "react";
import LinkComponent from "@/components/ui/link";
import { safeFetch } from "@/lib/client/safeFetch";
import { ErrorState } from "@/components/ui/errorstate";
import { EmptyState } from "@/components/ui/emptystate";

interface RecommendedClass {
    id: number;
    name: string;
    description: string;
    category: string;
    venue: string;
    town: string;
    age_group_min: number;
    age_group_max: number;
}

interface RecommendedClassesProps {
    childId?: string | null;
}

export function RecommendedClasses({ childId }: RecommendedClassesProps) {
    const [classes, setClasses] = useState<RecommendedClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!childId) {
            setClasses([]);
            setLoading(false);
            return;
        }

        const fetchRecommendations = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await safeFetch<{ data?: RecommendedClass[] }>(
                    `/api/recommendations/classes?childId=${childId}`
                );

                if (!response.ok) {
                    throw new Error(response.error || "Failed to fetch recommendations");
                }

                const rawClasses = response.data?.data || [];

                // Process recommendations on server (filter, sort, limit)
                const transformResult = await safeFetch<{
                    data: { recommendations?: RecommendedClass[] };
                }>("/api/recommendations/transform", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        recommendations: rawClasses,
                        limit: 10, // Show top 10 for this component
                    }),
                });

                if (transformResult.ok && transformResult.data?.data?.recommendations) {
                    setClasses(transformResult.data.data.recommendations);
                } else {
                    // Fallback to raw classes if transform fails
                    setClasses(rawClasses);
                }
            } catch (err: unknown) {
                console.error("[RecommendedClasses] Unexpected error:", err);
                const errorMessage = err instanceof Error ? err.message : "Failed to load recommendations";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [childId]);

    if (!childId) {
        return (
            <div className="rounded-lg border border-sage/20 bg-cream/40 p-6 text-center">
                <p className="text-slateSoft">Select a child profile to see personalized class recommendations.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="rounded-lg border border-sage/20 bg-white p-6">
                <p className="text-slateSoft">Loading recommendations...</p>
            </div>
        );
    }

    if (error) {
        return (
            <ErrorState
                title="Unable to load recommendations"
                message={error}
                onRetry={() => {
                    setError(null);
                    setLoading(true);
                    // Trigger refetch
                    const fetchRecommendations = async () => {
                        try {
                            if (!childId) return;
                            const response = await safeFetch<{ data?: RecommendedClass[] }>(
                                `/api/recommendations/classes?childId=${childId}`
                            );
                            if (!response.ok) {
                                throw new Error(response.error || "Failed to fetch recommendations");
                            }
                            const rawClasses = response.data?.data || [];
                            const transformResult = await safeFetch<{
                                data: { recommendations?: RecommendedClass[] };
                            }>("/api/recommendations/transform", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    recommendations: rawClasses,
                                    limit: 10,
                                }),
                            });
                            if (transformResult.ok && transformResult.data?.data?.recommendations) {
                                setClasses(transformResult.data.data.recommendations);
                            } else {
                                setClasses(rawClasses);
                            }
                        } catch (err: unknown) {
                            const errorMessage = err instanceof Error ? err.message : "Failed to load recommendations";
                            setError(errorMessage);
                        } finally {
                            setLoading(false);
                        }
                    };
                    fetchRecommendations();
                }}
                retryLabel="Try again"
                isDynamic={true}
            />
        );
    }

    if (classes.length === 0) {
        return (
            <EmptyState
                title="No recommendations found"
                description="No personalized recommendations available at this time. Try adjusting your search filters or check back later."
                iconVariant="inbox"
                size="default"
            />
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-body font-semibold text-charcoal">Recommended Classes for Your Child</h3>
            <div className="grid gap-card md:grid-cols-2">
                {classes.map((classItem) => (
                    <LinkComponent
                        key={classItem.id}
                        href={`/class/${classItem.id}`}
                        className="rounded-lg border border-sage/20 bg-surface-alt p-section shadow-soft transition hover:shadow-glow"
                        prefetch={false}
                    >
                        <h4 className="font-semibold text-text-primary">{classItem.name}</h4>
                        <p className="mt-1 text-body text-slateSoft line-clamp-2">{classItem.description}</p>
                        <div className="mt-2 flex items-center gap-2 text-body text-slateSoft">
                            <span className="rounded-full bg-brand/10 px-2 py-1 text-brand">
                                {classItem.category}
                            </span>
                            <span>{classItem.venue}, {classItem.town}</span>
                        </div>
                    </LinkComponent>
                ))}
            </div>
        </div>
    );
}

