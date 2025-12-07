"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * ScrollRestoration component that saves and restores scroll position
 * between navigations using Next.js router events.
 * 
 * Uses sessionStorage to persist scroll positions per route.
 * Handles both programmatic navigation and browser back/forward navigation.
 */
export function ScrollRestoration() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const isRestoring = useRef(false);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const previousRouteKey = useRef<string>("");
  const navigationType = useRef<"push" | "pop">("push");

  // Create a unique key for the current route (pathname + search params)
  const getRouteKey = (): string => {
    const currentPathname = pathname || "/";
    if (!searchParams) return currentPathname;
    const search = searchParams.toString();
    return search ? `${currentPathname}?${search}` : currentPathname;
  };

  // Detect browser navigation (back/forward) vs programmatic navigation
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      navigationType.current = "pop";
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Save scroll position to sessionStorage
  const saveScrollPosition = (routeKey: string) => {
    if (typeof window === "undefined") return;
    
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    
    try {
      // Store in both memory and sessionStorage for reliability
      scrollPositions.current.set(routeKey, scrollY);
      sessionStorage.setItem(`scroll:${routeKey}`, String(scrollY));
    } catch (error) {
      // sessionStorage might be unavailable (e.g., in private browsing)
      console.warn("Failed to save scroll position:", error);
    }
  };

  // Restore scroll position from sessionStorage
  const restoreScrollPosition = (routeKey: string) => {
    if (typeof window === "undefined") return;

    isRestoring.current = true;

    // Try to get from memory first, then sessionStorage
    let scrollY = scrollPositions.current.get(routeKey);
    
    if (scrollY === undefined) {
      try {
        const stored = sessionStorage.getItem(`scroll:${routeKey}`);
        if (stored) {
          scrollY = parseInt(stored, 10);
          if (!isNaN(scrollY)) {
            scrollPositions.current.set(routeKey, scrollY);
          }
        }
      } catch (error) {
        console.warn("Failed to restore scroll position:", error);
      }
    }

    if (scrollY !== undefined && scrollY > 0) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo({
          top: scrollY!,
          behavior: "auto", // Instant restore, not smooth
        });
        
        // Reset flag after a short delay to allow scroll events to settle
        setTimeout(() => {
          isRestoring.current = false;
        }, 100);
      });
    } else {
      // If no saved position, scroll to top for new routes
      if (navigationType.current === "push") {
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: "auto" });
        });
      }
      isRestoring.current = false;
    }
  };

  // Handle scroll events to save position
  useEffect(() => {
    if (typeof window === "undefined") return;

    const routeKey = getRouteKey();
    
    const handleScroll = () => {
      // Don't save scroll position if we're currently restoring
      if (isRestoring.current) return;

      // Debounce scroll saving to avoid excessive writes
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }

      saveTimer.current = setTimeout(() => {
        saveScrollPosition(routeKey);
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [pathname, searchParams]);

  // Handle route changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const routeKey = getRouteKey();
    
    // Save scroll position of previous route before navigating
    if (previousRouteKey.current && previousRouteKey.current !== routeKey) {
      const currentScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      if (currentScrollY > 0) {
        saveScrollPosition(previousRouteKey.current);
      }
    }

    // Restore scroll position for the new route
    // Use a small delay to ensure the page has rendered
    const restoreTimer = setTimeout(() => {
      restoreScrollPosition(routeKey);
      // Reset navigation type after restoration
      navigationType.current = "push";
    }, 0);

    // Update previous route key
    previousRouteKey.current = routeKey;

    return () => {
      clearTimeout(restoreTimer);
    };
  }, [pathname, searchParams]);

  // Cleanup: Save scroll position on unmount
  useEffect(() => {
    return () => {
      if (typeof window === "undefined") return;
      const routeKey = getRouteKey();
      saveScrollPosition(routeKey);
    };
  }, [pathname, searchParams]);

  return null;
}

