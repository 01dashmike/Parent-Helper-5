"use client";

import { useEffect, useCallback, useMemo } from "react";
import { track, page } from "@/lib/analytics/index";
import { usePageAnalytics } from "@/lib/tracking/usePageAnalytics";
import { trackWebsiteClick, trackPhoneClick, trackCtaClick, trackGalleryOpen } from "@/lib/tracking/events";

type ClassPageClientProps = {
  classId: string;
  className?: string;
  category?: string | null;
  location?: string | null;
  providerId?: number | null;
};

/**
 * Optimized client component to track class page views
 * Uses single event delegation for better performance
 */
export default function ClassPageClient({
  classId,
  className,
  category,
  location,
  providerId,
}: ClassPageClientProps) {
  const classIdNum = useMemo(() => parseInt(classId, 10), [classId]);

  // Use new page analytics hook for automatic tracking
  usePageAnalytics({
    classId: classIdNum,
    providerId: providerId || undefined,
    pageType: "class",
  });

  useEffect(() => {
    // Track page view (legacy analytics) - only on mount
    page(`/class/${classId}`, className || undefined);

    // Track class page view event (legacy analytics) - only on mount
    track("class_page_viewed", {
      classId,
      className: className || null,
      category: category || null,
      location: location || null,
    });
  }, [classId, className, category, location]);

  // Optimized: Single event delegation handler for all click tracking
  const handleClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Check for CTA clicks (book, directions, message)
    const button = target.closest("a[href*='booking'], button, a[href*='book']");
    if (button) {
      const text = button.textContent?.toLowerCase() || "";
      let ctaType = "unknown";
      
      if (text.includes("book")) {
        ctaType = "book_now";
      } else if (text.includes("directions") || text.includes("map")) {
        ctaType = "get_directions";
      } else if (text.includes("message") || text.includes("contact")) {
        ctaType = "message";
      }
      
      trackCtaClick(ctaType, providerId || undefined, classIdNum);
      return;
    }

    // Check for website clicks
    const link = target.closest('a[href^="http"]');
    if (link && link.getAttribute("href")?.includes("website")) {
      trackWebsiteClick(providerId || 0, classIdNum);
      return;
    }

    // Check for phone clicks
    const telLink = target.closest('a[href^="tel:"]');
    if (telLink) {
      trackPhoneClick(providerId || 0, classIdNum);
      return;
    }

    // Check for gallery clicks
    const image = target.closest("img[src*='storage'], img[src*='image']");
    if (image && image.closest("section, div[class*='gallery'], div[class*='image']")) {
      trackGalleryOpen(providerId || undefined, classIdNum);
    }
  }, [classIdNum, providerId]);

  useEffect(() => {
    // Use single event listener with delegation for better performance
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [handleClick]);

  return null; // This component doesn't render anything
}

