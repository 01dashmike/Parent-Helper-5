"use client";

import { ExternalLink } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { track } from "@/lib/analytics/index";
import LinkComponent from "@/components/ui/link";

type BookingButtonProps = {
  paymentLinkUrl: string;
  occurrenceId: number;
  className?: string;
};

export function BookingButton({ className = "", occurrenceId, paymentLinkUrl }: BookingButtonProps) {
  // Feature flag check - component only renders when feature is enabled
  // Server-side check happens before rendering

  const handleClick = () => {
    // Track booking start via new abstraction
    track("booking_started", {
      occurrenceId,
    });

    // Legacy tracking (can be removed later)
    if (typeof window !== "undefined") {
      type WindowWithGtag = Window & { gtag?: (command: string, eventName: string, params?: Record<string, unknown>) => void };
      (window as WindowWithGtag).gtag?.("event", "booking_click", {
        occurrence_id: occurrenceId,
      });
    }
  };

  return (
    <LinkComponent
      href={paymentLinkUrl}
      onClick={handleClick}
      className={`inline-flex items-center gap-2 rounded-card px-md py-sm text-small font-medium bg-accent text-white hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 transition-all duration-200 ${className}`}
      aria-label="Book now (opens in new tab)"
      tabIndex={0}
    >
      Book now
      <ExternalLink size={iconSize.sm} aria-hidden="true" />
    </LinkComponent>
  );
}

