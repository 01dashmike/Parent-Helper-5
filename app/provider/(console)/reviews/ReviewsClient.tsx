"use client";

import { useState, useMemo, useEffect } from "react";
import { ProviderRating } from "@/components/ProviderRating";
import { useToast } from "@/hooks/use-toast";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { EmptyState } from "@/components/ui/emptystate";

type Review = {
    id: string;
    rating: number;
    comment: string | null;
    source: "google" | "parenthelper";
    status: "pending" | "approved" | "rejected";
    reviewer_name: string | null;
    reviewer_email: string | null;
    response_text: string | null;
    response_at: string | null;
    created_at: string;
    booking_id: string | null;
    helpful_count?: number | null;
    not_helpful_count?: number | null;
};

type Reputation = {
    avg_rating: number | null;
    review_count: number;
    google_review_count: number;
    parenthelper_review_count: number;
} | null;

type ReviewsClientProps = {
    reviews: Review[];
    reputation: Reputation;
    providerId: number;
};

type SortOption = "newest" | "highest-rated" | "most-helpful";

export default function ReviewsClient({ reviews, reputation, providerId: _providerId }: ReviewsClientProps) {
    const { showError, showSuccess } = useToast();
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [verifiedBookings, setVerifiedBookings] = useState<Set<string>>(new Set());
    const [userVotes, setUserVotes] = useState<Record<string, boolean | null>>({});
    const [loadingVotes, setLoadingVotes] = useState(true);

    // Fetch verified bookings and user votes on mount
    useEffect(() => {
        const fetchData = async () => {
            const bookingIds = reviews
                .filter((r) => r.booking_id && r.status === "approved")
                .map((r) => r.booking_id!)
                .filter(Boolean);

            // Check which bookings have completed status
            if (bookingIds.length > 0) {
                const verifiedPromises = bookingIds.map(async (bookingId) => {
                    try {
                        const res = await fetch(`/api/reviews/booking-status/${bookingId}`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.status === "completed" || data.status === "confirmed") {
                                return bookingId;
                            }
                        }
                    } catch (error) {
                        console.error(`Failed to check booking ${bookingId}:`, error);
                    }
                    return null;
                });

                const verifiedIds = await Promise.all(verifiedPromises);
                setVerifiedBookings(new Set(verifiedIds.filter(Boolean) as string[]));
            }

            // Fetch user votes for all reviews
            const votePromises = reviews
                .filter((r) => r.status === "approved")
                .map(async (review) => {
                    try {
                        const res = await fetch(`/api/reviews/helpful?review_id=${review.id}`);
                        if (res.ok) {
                            const data = await res.json();
                            return {
                                reviewId: review.id,
                                vote: data.has_voted
                                    ? data.is_helpful
                                        ? "helpful"
                                        : "not_helpful"
                                    : null,
                            };
                        }
                    } catch (error) {
                        console.error(`Failed to fetch vote for review ${review.id}:`, error);
                    }
                    return { reviewId: review.id, vote: null };
                });

            const votes = await Promise.all(votePromises);
            const votesMap: Record<string, boolean | null> = {};
            votes.forEach(({ reviewId, vote }) => {
                votesMap[reviewId] = vote === "helpful" ? true : vote === "not_helpful" ? false : null;
            });
            setUserVotes(votesMap);
            setLoadingVotes(false);
        };

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleResponseSubmit = async (reviewId: string, responseTextValue: string) => {
        if (!responseTextValue.trim()) return;

        try {
            const response = await fetch("/api/reviews/response", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    review_id: reviewId,
                    response_text: responseTextValue,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to submit response");
            }

            // Reload page to show updated response
            window.location.reload();
        } catch (error) {
            console.error("Failed to submit response:", error);
            showError("Failed to submit response. Please try again.");
        }
    };

    const handleHelpfulVote = async (reviewId: string, isHelpful: boolean) => {
        try {
            const response = await fetch("/api/reviews/helpful", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    review_id: reviewId,
                    is_helpful: isHelpful,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to vote");
            }

            const data = await response.json();

            // Update local state
            setUserVotes((prev) => ({
                ...prev,
                [reviewId]: isHelpful ? true : false,
            }));

            // Update review counts in the reviews array
            // Note: In a real app, you'd want to refetch or update state more elegantly
            // For now, we'll trigger a reload to get fresh data
            window.location.reload();
        } catch (error) {
            console.error("Failed to vote:", error);
            showError("Failed to submit vote. Please try again.");
        }
    };

    const handleReport = async (reviewId: string, reportType: string, reason?: string) => {
        try {
            const response = await fetch("/api/reviews/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    review_id: reviewId,
                    report_type: reportType,
                    reason: reason || null,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to submit report");
            }

            showSuccess("Thank you for reporting this review. We'll review it shortly.");
        } catch (error) {
            console.error("Failed to report:", error);
            showError(error instanceof Error ? error.message : "Failed to submit report. Please try again.");
        }
    };

    const approvedReviews = reviews.filter((r) => r.status === "approved");

    // Sort reviews
    const sortedReviews = useMemo(() => {
        const sorted = [...approvedReviews];
        switch (sortBy) {
            case "newest":
                sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                break;
            case "highest-rated":
                sorted.sort((a, b) => b.rating - a.rating);
                break;
            case "most-helpful":
                sorted.sort((a, b) => {
                    const aHelpful = (a.helpful_count || 0) - (a.not_helpful_count || 0);
                    const bHelpful = (b.helpful_count || 0) - (b.not_helpful_count || 0);
                    return bHelpful - aHelpful;
                });
                break;
        }
        return sorted;
    }, [approvedReviews, sortBy]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-display-2 font-semibold text-charcoal">Reviews</h1>
                <p className="text-small text-charcoal/70 mt-1">Manage and respond to customer reviews</p>
            </div>

            {/* Reputation Summary */}
            {reputation && (
                <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-title font-semibold text-charcoal mb-2">Overall Rating</h2>
                            <ProviderRating
                                avgRating={reputation.avg_rating}
                                reviewCount={reputation.review_count}
                                size="lg"
                            />
                        </div>
                        <div className="text-right text-small text-charcoal/70">
                            <p>Google: {reputation.google_review_count} reviews</p>
                            <p>Parent Helper: {reputation.parenthelper_review_count} reviews</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-title font-semibold text-charcoal">
                        All Reviews ({approvedReviews.length})
                    </h2>
                    {approvedReviews.length > 0 && (
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="rounded-lg border border-sage/30 bg-white px-3 py-2 text-small text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                        >
                            <option value="newest">Newest first</option>
                            <option value="highest-rated">Highest rated</option>
                            <option value="most-helpful">Most helpful</option>
                        </select>
                    )}
                </div>

                {approvedReviews.length === 0 ? (
                    <EmptyState
                        title="No reviews yet"
                        description="Reviews will appear here once customers submit them. Encourage parents to leave feedback after their sessions."
                        iconVariant="inbox"
                    />
                ) : (
                    sortedReviews.map((review) => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            isVerified={review.booking_id ? verifiedBookings.has(review.booking_id) : false}
                            userVote={userVotes[review.id] === true ? "helpful" : userVotes[review.id] === false ? "not_helpful" : null}
                            onHelpfulVote={handleHelpfulVote}
                            onReport={handleReport}
                            showProviderActions={true}
                            onResponseSubmit={handleResponseSubmit}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
