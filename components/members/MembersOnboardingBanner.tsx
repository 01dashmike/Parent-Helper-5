"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import LinkComponent from "@/components/ui/link";
import { X, Sparkles } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";

const MEMBERS_ENABLED = process.env.NEXT_PUBLIC_MEMBERS_ENABLED !== "false";
const STORAGE_KEY = "members_banner_dismissed";

export function MembersOnboardingBanner() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!MEMBERS_ENABLED) return;
    
    // Don't show on account pages or login
    if (pathname?.startsWith("/account")) return;
    
    // Check if dismissed
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY) === "true";
      if (dismissed) return;
    } catch {
      // localStorage not available
    }

    // Show after a delay
    const timer = setTimeout(() => setIsVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // localStorage not available
    }
  };

  if (!MEMBERS_ENABLED || !isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <div className="relative rounded-2xl border border-sage/30 bg-gradient-to-br from-sage/10 via-white to-cream/50 p-6 shadow-xl">
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 text-charcoal/50 transition hover:text-charcoal"
          aria-label="Dismiss"
        >
          <X size={iconSize.sm} aria-hidden="true" />
        </button>
        <div className="flex items-start gap-3">
          <Sparkles size={iconSize.md} className="text-sage shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <h3 className="font-semibold text-charcoal mb-1">
              Get notified about new classes near you
            </h3>
            <p className="text-small text-slateSoft mb-4">
              Save your searches and plans for free → Join Parent Helper Members.
            </p>
            <LinkComponent
              href="/account/login"
              className="inline-flex items-center justify-center rounded-full bg-brand px-4 py-2 text-body font-semibold text-white transition hover:bg-brand/90"
              prefetch={false}
            >
              Join Members
            </LinkComponent>
          </div>
        </div>
      </div>
    </div>
  );
}

