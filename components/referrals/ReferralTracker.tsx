"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Ensures cookie check runs ONLY once per browser session.
 * Guards against Strict Mode double-mount AND layout remounts.
 */
let cookieChecked = false;

export default function ReferralTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const refTracked = useRef(false);

  // -------------------------------
  // 🔐 ADMIN GUARD — disable entirely on /admin
  // -------------------------------
  const isAdminRoute = pathname?.startsWith("/admin");

  // -------------------------------
  // 1) COOKIE CHECK — run once per browser session
  // -------------------------------
  useEffect(() => {
    if (isAdminRoute) return; // safety
    if (cookieChecked) return;

    cookieChecked = true;

    fetch("/api/referrals/check-cookie", {
      method: "GET",
    }).catch((err) => {
      console.warn("[ReferralTracker] Cookie check failed:", err);
    });
  }, [isAdminRoute]);

  // -------------------------------
  // 2) REF TRACKING — run only when ?ref= is present AND not already handled
  // -------------------------------
  useEffect(() => {
    if (isAdminRoute) return; // safety

    const ref = searchParams?.get("ref");
    if (!ref) return;
    if (refTracked.current) return; // prevents duplicates

    refTracked.current = true;

    fetch(`/api/referrals/track?ref=${encodeURIComponent(ref)}`, {
      method: "POST",
    }).catch((err) => {
      console.warn("[ReferralTracker] Ref tracking failed:", err);
    });
  }, [isAdminRoute, searchParams]);

  if (isAdminRoute) {
    return null;
  }

  return null;
}
