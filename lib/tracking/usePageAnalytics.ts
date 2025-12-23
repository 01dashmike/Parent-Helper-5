"use client";

import { useEffect, useRef } from "react";
import {
  trackClassView,
  trackProfileView,
  trackTimeOnPage,
  trackScrollDepth,
} from "./events";

interface UsePageAnalyticsOptions {
  providerId?: number;
  classId?: number;
  pageType: "class" | "profile";
}

/**
 * React hook for automatic page analytics tracking
 * 
 * Tracks:
 * - Page view (on mount)
 * - Time on page (5s, 15s, 30s, 60s, then every 60s)
 * - Scroll depth (50%, 75%, 100%)
 */
export function usePageAnalytics({ providerId, classId, pageType }: UsePageAnalyticsOptions) {
  const timeTrackedRef = useRef<Set<number>>(new Set());
  const scrollTrackedRef = useRef<Set<number>>(new Set());
  const startTimeRef = useRef<number>(Date.now());

  // Track page view on mount
  useEffect(() => {
    if (pageType === "class" && classId) {
      trackClassView(classId, providerId);
    } else if (pageType === "profile" && providerId) {
      trackProfileView(providerId);
    }
  }, [pageType, classId, providerId]);

  // Track time on page
  useEffect(() => {
    const intervals = [5, 15, 30, 60];
    const timers: NodeJS.Timeout[] = [];

    // Track at specific intervals
    intervals.forEach((seconds) => {
      const timer = setTimeout(() => {
        if (!timeTrackedRef.current.has(seconds)) {
          trackTimeOnPage(seconds, providerId, classId);
          timeTrackedRef.current.add(seconds);
        }
      }, seconds * 1000);
      timers.push(timer);
    });

    // Track every 60s after the first minute
    const recurringTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (elapsed > 60 && elapsed % 60 === 0) {
        trackTimeOnPage(elapsed, providerId, classId);
      }
    }, 60000);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(recurringTimer);
    };
  }, [providerId, classId]);

  // Track scroll depth
  useEffect(() => {
    const scrollThresholds = [50, 75, 100];
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY || document.documentElement.scrollTop;
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollPercent = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;

          scrollThresholds.forEach((threshold) => {
            if (scrollPercent >= threshold && !scrollTrackedRef.current.has(threshold)) {
              trackScrollDepth(threshold, providerId, classId);
              scrollTrackedRef.current.add(threshold);
            }
          });

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [providerId, classId]);
}








