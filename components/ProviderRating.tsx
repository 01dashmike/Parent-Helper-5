"use client";

import { Star } from "lucide-react";
import { isReviewsFeatureEnabled } from "@/lib/env";

type ProviderRatingProps = {
    avgRating: number | null;
    reviewCount: number;
    showLabel?: boolean;
    size?: "sm" | "md" | "lg";
};

export function ProviderRating({ avgRating, reviewCount, showLabel = true, size = "md" }: ProviderRatingProps) {
    if (!isReviewsFeatureEnabled()) {
        return null;
    }

    if (!avgRating || reviewCount === 0) {
        return null;
    }

    const sizeClasses = {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-5 w-5",
    };

    const starSize = sizeClasses[size];
    const roundedRating = Math.round(avgRating * 10) / 10;

    return (
        <div className="inline-flex items-center gap-1.5" role="img" aria-label={`Rating: ${roundedRating} out of 5 stars, ${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}`}>
            <div className="flex items-center gap-0.5">
                <Star className={`${starSize} fill-yellow-400 text-yellow-400`} aria-hidden="true" />
                <span className={`font-semibold text-charcoal ${size === "lg" ? "text-title" : "text-smallall"}`}>
                    {roundedRating}
                </span>
            </div>
            {showLabel && (
                <span className="text-small text-text-tertiary">
                    ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                </span>
            )}
        </div>
    );
}

