"use client";

import { useState, useEffect } from "react";
import { Star, CheckCircle2, ThumbsUp, ThumbsDown, Flag, MessageSquare } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

type ReviewCardProps = {
    review: {
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
    isVerified?: boolean; // Whether reviewer attended the class
    userVote?: "helpful" | "not_helpful" | null;
    onHelpfulVote?: (reviewId: string, isHelpful: boolean) => void;
    onReport?: (reviewId: string, reportType: string, reason?: string) => void;
    showProviderActions?: boolean;
    onResponseSubmit?: (reviewId: string, responseText: string) => void;
};

export function ReviewCard({
    review,
    isVerified = false,
    userVote = null,
    onHelpfulVote,
    onReport,
    showProviderActions = false,
    onResponseSubmit,
}: ReviewCardProps) {
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [reportType, setReportType] = useState<string>("");
    const [reportReason, setReportReason] = useState<string>("");
    const [responseText, setResponseText] = useState<string>("");
    const [submittingResponse, setSubmittingResponse] = useState(false);
    const [submittingVote, setSubmittingVote] = useState(false);
    const [submittingReport, setSubmittingReport] = useState(false);
    const [formattedCreatedDate, setFormattedCreatedDate] = useState<string>("");
    const [formattedResponseDate, setFormattedResponseDate] = useState<string>("");

    const helpfulCount = review.helpful_count || 0;
    const notHelpfulCount = review.not_helpful_count || 0;

    // Format dates on client side to avoid hydration mismatches
    useEffect(() => {
        if (review.created_at) {
            setFormattedCreatedDate(new Date(review.created_at).toLocaleDateString("en-GB"));
        }
        if (review.response_at) {
            setFormattedResponseDate(new Date(review.response_at).toLocaleDateString("en-GB"));
        }
    }, [review.created_at, review.response_at]);

    const handleHelpfulClick = async () => {
        if (!onHelpfulVote || submittingVote) return;
        setSubmittingVote(true);
        try {
            await onHelpfulVote(review.id, true);
        } finally {
            setSubmittingVote(false);
        }
    };

    const handleNotHelpfulClick = async () => {
        if (!onHelpfulVote || submittingVote) return;
        setSubmittingVote(true);
        try {
            await onHelpfulVote(review.id, false);
        } finally {
            setSubmittingVote(false);
        }
    };

    const handleReportSubmit = async () => {
        if (!onReport || !reportType || submittingReport) return;
        setSubmittingReport(true);
        try {
            await onReport(review.id, reportType, reportReason || undefined);
            setShowReportDialog(false);
            setReportType("");
            setReportReason("");
        } finally {
            setSubmittingReport(false);
        }
    };

    const handleResponseSubmit = async () => {
        if (!onResponseSubmit || !responseText.trim() || submittingResponse) return;
        setSubmittingResponse(true);
        try {
            await onResponseSubmit(review.id, responseText);
            setResponseText("");
        } finally {
            setSubmittingResponse(false);
        }
    };

    return (
        <div className="rounded-lg border border-sage/20 bg-white p-6 space-y-4">
            {/* Review Header */}
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <Star
                                    key={value}
                                    className={cn(
                                        "h-4 w-4",
                                        review.rating >= value
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-slateSoft"
                                    )}
                                    width={16}
                                    height={16}
                                    aria-hidden="true"
                                />
                            ))}
                        </div>
                        <span className="text-small font-medium text-charcoal truncate" lang="en">
                            {review.reviewer_name || "Anonymous"}
                        </span>
                        {isVerified && (
                            <span
                                className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-small font-medium text-green-700"
                            >
                                <CheckCircle2 size={iconSize.sm} aria-hidden="true" />
                                <VisuallyHidden>Verified: This reviewer attended the class</VisuallyHidden>
                                Verified
                            </span>
                        )}
                        <span className="text-small text-charcoal/50">
                            {review.source === "google" ? "Google" : "Parent Helper"}
                        </span>
                        <span className="text-small text-charcoal/50">
                            {formattedCreatedDate || "Loading..."}
                        </span>
                    </div>
                    {review.comment && (
                        <p className="text-charcoal/80 mb-4 line-clamp-4" lang="en">{review.comment}</p>
                    )}
                </div>
            </div>

            {/* Helpfulness Voting */}
            {!showProviderActions && (
                <div className="flex items-center gap-4 pt-2 border-t border-sage/10">
                    <span className="text-small text-charcoal/60">Was this helpful?</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleHelpfulClick}
                            disabled={submittingVote}
                            className={cn(
                                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-small font-medium transition",
                                userVote === "helpful"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-cream text-charcoal hover:bg-cream/80",
                                submittingVote && "opacity-50 cursor-not-allowed"
                            )}
                            aria-label={helpfulCount > 0 ? `Mark as helpful (${helpfulCount} helpful)` : "Mark as helpful"}
                        >
                            <ThumbsUp size={iconSize.sm} aria-hidden="true" />
                            {helpfulCount > 0 && <span>{helpfulCount}</span>}
                        </button>
                        <button
                            onClick={handleNotHelpfulClick}
                            disabled={submittingVote}
                            className={cn(
                                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-small font-medium transition",
                                userVote === "not_helpful"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-cream text-charcoal hover:bg-cream/80",
                                submittingVote && "opacity-50 cursor-not-allowed"
                            )}
                            aria-label={notHelpfulCount > 0 ? `Mark as not helpful (${notHelpfulCount} not helpful)` : "Mark as not helpful"}
                        >
                            <ThumbsDown size={iconSize.sm} aria-hidden="true" />
                            {notHelpfulCount > 0 && <span>{notHelpfulCount}</span>}
                        </button>
                    </div>
                    <button
                        onClick={() => setShowReportDialog(true)}
                        className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-small font-medium text-charcoal/60 hover:text-red-600 transition"
                        aria-label="Report this review"
                    >
                        <Flag size={iconSize.sm} aria-hidden="true" />
                        Report
                    </button>
                </div>
            )}

            {/* Report Dialog */}
            {showReportDialog && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-section space-y-3">
                    <h4 className="text-smallall font-semibold text-red-900">Report Review</h4>
                    <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="input input-sm border-red-300 bg-white"
                    >
                        <option value="">Select reason...</option>
                        <option value="spam">Spam</option>
                        <option value="abuse">Abuse or harassment</option>
                        <option value="inappropriate">Inappropriate content</option>
                        <option value="fake">Fake review</option>
                        <option value="other">Other</option>
                    </select>
                    {reportType && (
                        <textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Additional details (optional)"
                            rows={2}
                            className="input input-sm border-red-300 bg-white"
                        />
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={handleReportSubmit}
                            disabled={!reportType || submittingReport}
                            className="rounded-md bg-red-600 px-4 py-2 text-small font-medium text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submittingReport ? "Submitting..." : "Submit Report"}
                        </button>
                        <button
                            onClick={() => {
                                setShowReportDialog(false);
                                setReportType("");
                                setReportReason("");
                            }}
                            className="rounded-md border border-red-300 bg-white px-4 py-2 text-small font-medium text-red-700 transition hover:bg-red-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Provider Response Section */}
            {showProviderActions && (
                <>
                    {review.response_text ? (
                        <div className="rounded-lg bg-cream/40 p-section border-l-4 border-sage">
                            <div className="flex items-start gap-2 mb-2">
                                <MessageSquare size={iconSize.sm} className="text-sage mt-0.5" aria-hidden="true" />
                                <span className="text-small font-semibold text-charcoal">Your Response</span>
                            </div>
                            <p className="text-small text-charcoal/80">{review.response_text}</p>
                            {review.response_at && (
                                <p className="text-small text-charcoal/50 mt-2">
                                    {formattedResponseDate || "Loading..."}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="block text-small font-medium text-charcoal">
                                Respond to this review
                            </label>
                            <textarea
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                rows={3}
                                className="input input-md border-sage/20"
                                placeholder="Write a response..."
                            />
                            <button
                                onClick={handleResponseSubmit}
                                disabled={!responseText.trim() || submittingResponse}
                                className="rounded-lg bg-sage px-4 py-2 text-small font-medium text-white transition hover:bg-sage/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submittingResponse ? "Submitting..." : "Submit Response"}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

