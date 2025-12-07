"use client";

import { useEffect, useState } from "react";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_name: string | null;
  created_at: string;
  source: string;
};

export default function ReviewsSummary({
  averageRating,
  reviewCount,
  providerId,
}: {
  averageRating?: number;
  reviewCount?: number;
  providerId: number;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const safeAverageRating = averageRating || 0;
  const safeReviewCount = reviewCount || 0;

  useEffect(() => {
    let cancelled = false;

    async function fetchReviews() {
      try {
        const response = await fetch(`/api/provider/reviews?provider_id=${providerId}&limit=5`);
        if (cancelled) return;
        
        if (response.ok) {
          const data = await response.json();
          if (!cancelled) {
            setReviews(Array.isArray(data?.reviews) ? data.reviews : []);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch reviews:", err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (safeReviewCount > 0) {
      fetchReviews();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [providerId, safeReviewCount]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? "text-yellow-400" : "text-gray-300"}>
        ★
      </span>
    ));
  };

  return (
    <div className="rounded-xl border border-sage/30 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-charcoal">Reviews Summary</h3>
        {safeAverageRating > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold text-charcoal">{safeAverageRating.toFixed(1)}</span>
            <div className="flex">{renderStars(Math.round(safeAverageRating))}</div>
            <span className="text-sm text-charcoal/70">({safeReviewCount})</span>
          </div>
        ) : (
          <span className="text-sm text-charcoal/70" role="status">No reviews yet</span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-charcoal/70">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <div role="status">
          <h4 className="text-sm font-semibold text-charcoal">No reviews yet</h4>
          <p className="mt-1 text-small text-charcoal/50">Reviews will appear here once customers submit them.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-t border-sage/20 pt-4 first:border-t-0 first:pt-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    {renderStars(review.rating)}
                    <span className="text-small text-charcoal/60">
                      {review.reviewer_name || "Anonymous"}
                    </span>
                    <span className="text-small text-charcoal/40">
                      {new Date(review.created_at).toLocaleDateString("en-GB")}
                    </span>
                    {review.source && (
                      <span className="rounded-full bg-sage/20 px-2 py-0.5 text-small text-sage/80">
                        {review.source}
                      </span>
                    )}
                  </div>
                  {review.comment && (
                    <p className="text-sm text-charcoal/80">{review.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

