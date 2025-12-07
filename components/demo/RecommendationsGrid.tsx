"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LinkComponent from "@/components/ui/link";
import { ErrorState } from "@/components/ui/errorstate";
import { EmptyState } from "@/components/ui/emptystate";

interface Recommendation {
  id: string;
  class_id: number;
  score: number;
  rationale: string | null;
  classes: {
    id: number;
    name: string;
    description: string;
    category: string;
    venue: string;
    town: string;
    price: string | null;
  } | null;
}

interface RecommendationsGridProps {
  familyId: string;
  limit?: number;
}

export default function RecommendationsGrid({ familyId, limit = 6 }: RecommendationsGridProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        // Get user_id from family_id
        const familyRes = await fetch(`/api/demo/family-user?familyId=${familyId}`);
        if (!familyRes.ok) {
          throw new Error("Failed to fetch family user");
        }
        const { userId } = await familyRes.json();

        // Fetch recommendations directly from Supabase via API
        // Note: This requires the recommendations to be stored in the database
        const res = await fetch(`/api/demo/recommendations?userId=${userId}&limit=${limit}`);
        if (!res.ok) {
          throw new Error("Failed to fetch recommendations");
        }
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load recommendations";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [familyId, limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-card md:grid-cols-2" aria-busy="true" aria-label="Loading recommendations">
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="h-32 skeleton rounded-lg" aria-hidden="true" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Error loading recommendations"
        message={error}
        onRetry={() => {
          setError(null);
          setLoading(true);
          // Trigger refetch
          const fetchRecommendations = async () => {
            try {
              const familyRes = await fetch(`/api/demo/family-user?familyId=${familyId}`);
              if (!familyRes.ok) {
                throw new Error("Failed to fetch family user");
              }
              const { userId } = await familyRes.json();
              const res = await fetch(`/api/demo/recommendations?userId=${userId}&limit=${limit}`);
              if (!res.ok) {
                throw new Error("Failed to fetch recommendations");
              }
              const data = await res.json();
              setRecommendations(data.recommendations || []);
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

  if (recommendations.length === 0) {
    return (
      <EmptyState
        title="No recommendations yet"
        description="Run the seed script to generate recommendations."
        iconVariant="inbox"
      />
    );
  }

  // Group by category
  const grouped = recommendations.reduce((acc, rec) => {
    const category = rec.classes?.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(rec);
    return acc;
  }, {} as Record<string, Recommendation[]>);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, recs]) => (
        <div key={category}>
          <h3 className="mb-3 text-title text-charcoal">{category}</h3>
          <div className="grid grid-cols-1 gap-card md:grid-cols-2">
            {recs.slice(0, limit).map((rec, index) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="group rounded-lg border border-sage/20 bg-white p-4 shadow-card transition-shadow hover:shadow-md"
              >
                {rec.classes && (
                  <>
                    <h4 className="font-semibold text-charcoal group-hover:text-sage transition-colors">
                      {rec.classes.name}
                    </h4>
                    <p className="mt-1 text-small text-slateSoft line-clamp-2">
                      {rec.classes.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-small text-slateSoft">
                        {rec.classes.venue}, {rec.classes.town}
                      </span>
                      {rec.classes.price && (
                        <span className="text-small font-medium text-sage">{rec.classes.price}</span>
                      )}
                    </div>
                    {rec.rationale && (
                      <p className="mt-2 text-small italic text-slateSoft">💡 {rec.rationale}</p>
                    )}
                    <LinkComponent
                      href={`/class/${rec.classes.id}`}
                      className="mt-3 block text-body font-medium text-brand hover:underline"
                      prefetch={false}
                    >
                      View details →
                    </LinkComponent>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

