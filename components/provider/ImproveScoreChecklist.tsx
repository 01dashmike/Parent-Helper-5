"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  href?: string;
  progress?: number; // Progress percentage (0-100) for progress bar
  showProgress?: boolean; // Whether to show progress bar
}

interface ImproveScoreChecklistProps {
  profileCompletion: number;
  reviewCount: number;
  recentReviews?: number; // Reviews in last 60 days
  hasImages: boolean;
  hasDescription: boolean;
  conversionRate?: number; // Conversion rate percentage
  reviewResponseRate?: number; // Percentage of reviews with responses (0-100)
  totalReviews?: number; // Total approved reviews
  reviewsWithResponses?: number; // Number of reviews with responses
}

const ImproveScoreChecklist = memo(function ImproveScoreChecklist({
  profileCompletion = 0,
  reviewCount = 0,
  recentReviews = 0,
  hasImages = false,
  hasDescription = false,
  conversionRate = 0,
  reviewResponseRate = 0,
  totalReviews = 0,
  reviewsWithResponses: _ = 0,
}: ImproveScoreChecklistProps) {
  const safeProfileCompletion = profileCompletion ?? 0;
  const safeReviewCount = reviewCount ?? 0;
  const safeRecentReviews = recentReviews ?? 0;
  const safeConversionRate = conversionRate ?? 0;
  const safeReviewResponseRate = reviewResponseRate ?? 0;
  const safeTotalReviews = totalReviews ?? 0;
  const items: ChecklistItem[] = useMemo(() => [
    {
      id: "profile-complete",
      label: `Complete your profile (${safeProfileCompletion}% done)`,
      completed: safeProfileCompletion >= 90,
      href: "/provider/settings",
    },
    {
      id: "add-images",
      label: hasImages ? "Upload at least one photo" : "Upload at least one photo",
      completed: hasImages ?? false,
      href: "/provider/settings",
    },
    {
      id: "add-description",
      label: "Write a detailed class description",
      completed: hasDescription ?? false,
      href: "/provider/settings",
    },
    {
      id: "get-reviews",
      label: `Get more reviews (${safeReviewCount} total${safeRecentReviews > 0 ? `, ${safeRecentReviews} recent` : ""})`,
      completed: safeReviewCount >= 5 && safeRecentReviews >= 2,
      href: "/provider/reviews",
    },
    {
      id: "improve-conversion",
      label: `Improve conversion rate (${safeConversionRate.toFixed(1)}% views → bookings)`,
      completed: safeConversionRate >= 5, // 5% conversion rate is good
      href: "/provider/settings",
    },
    {
      id: "respond-reviews",
      label: `Respond to recent reviews (${safeReviewResponseRate}% responded)`,
      completed: safeReviewResponseRate >= 50, // Completed if ≥50% have responses (threshold for bonus points)
      href: "/provider/reviews",
      progress: safeReviewResponseRate, // For progress bar
      showProgress: safeTotalReviews > 0, // Show progress if there are reviews
    },
  ], [
    safeProfileCompletion,
    hasImages,
    hasDescription,
    safeReviewCount,
    safeRecentReviews,
    safeConversionRate,
    safeReviewResponseRate,
    safeTotalReviews,
  ]);

  const completedCount = useMemo(() => 
    items.filter((item) => item.completed).length,
    [items]
  );
  const progress = useMemo(() => 
    (completedCount / items.length) * 100,
    [completedCount, items.length]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Improve Your Score</CardTitle>
        <CardDescription>
          Complete these actions to boost your growth score
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-small font-medium text-charcoal">Progress</span>
            <span className="text-small text-slateSoft">{completedCount} of {items.length} completed</span>
          </div>
          <div className="w-full bg-cream rounded-full h-2">
            <div
              className="bg-sage h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <ul className="space-y-3">
          {items.map((item) => {
            const Icon = item.completed ? CheckCircle2 : Circle;
            const iconColor = item.completed ? "text-green-600" : "text-slateSoft";
            
            const content = item.href ? (
              <Link
                href={item.href}
                className="flex flex-col gap-2 p-2 rounded-lg hover:bg-cream/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-5 w-5 flex-shrink-0", iconColor)} aria-hidden="true" />
                  <span className={cn("flex-1", item.completed ? "text-slateSoft line-through" : "text-charcoal")}>
                    {item.label}
                  </span>
                  {!item.completed && (
                    <span className="text-small text-sage">→</span>
                  )}
                </div>
                {item.showProgress && item.progress !== undefined && (
                  <div className="ml-8">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-small text-slateSoft">Progress</span>
                      <span className="text-small text-slateSoft">{item.progress}%</span>
                    </div>
                    <div className="w-full bg-cream rounded-full h-1.5">
                      <div
                        className="bg-sage h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            ) : (
              <div className="flex flex-col gap-2 p-2">
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-5 w-5 flex-shrink-0", iconColor)} aria-hidden="true" />
                  <span className={cn("flex-1", item.completed ? "text-slateSoft line-through" : "text-charcoal")}>
                    {item.label}
                  </span>
                </div>
                {item.showProgress && item.progress !== undefined && (
                  <div className="ml-8">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-small text-slateSoft">Progress</span>
                      <span className="text-small text-slateSoft">{item.progress}%</span>
                    </div>
                    <div className="w-full bg-cream rounded-full h-1.5">
                      <div
                        className="bg-sage h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );

            return <li key={item.id}>{content}</li>;
          })}
        </ul>
      </CardContent>
    </Card>
  );
});

ImproveScoreChecklist.displayName = "ImproveScoreChecklist";

export default ImproveScoreChecklist;

