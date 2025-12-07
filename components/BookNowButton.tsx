"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvents } from "@/lib/analytics-track";
import { trackFunnelStepStarted } from "@/lib/analytics/funnels";
import { LoadingSpinner } from "@/components/spinners/LoadingSpinner";

interface BookNowButtonProps {
  classId: number;
  occurrenceId: number;
  className?: string;
}

export function BookNowButton({ className = "", classId, occurrenceId }: BookNowButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    if (loading) return; // Prevent double-clicks
    
    setLoading(true);
    
    try {
      // Track analytics
      trackEvents.bookingStarted(classId);

      // Track booking funnel
      trackFunnelStepStarted({
        funnelName: "class_booking",
        funnelStep: "booking_initiated",
        metadata: {
          classId,
          occurrenceId,
        },
      });

      // Redirect to checkout page with booking details
      router.push(`/book/checkout?classId=${classId}&occurrenceId=${occurrenceId}`);
    } catch (error) {
      console.error("[BookNowButton] Unexpected error:", error);
      setLoading(false);
      // Don't use alert - could be blocked. The router.push should not throw, but if it does, we reset loading state
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-disabled={loading}
      className={`inline-flex items-center justify-center rounded-card px-4 py-2 text-small font-medium gap-2 bg-sage text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none hover:bg-sage/90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${className}`}
      type="button"
      tabIndex={0}
      aria-label={loading ? "Loading booking" : "Book this class session"}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" label="Loading booking" />
          <span>Loading...</span>
        </>
      ) : (
        "Book Now"
      )}
    </button>
  );
}

