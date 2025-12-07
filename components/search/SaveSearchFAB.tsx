"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Loader2 } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { SaveSearchPrompt } from "@/components/modals/SaveSearchPrompt";
import { isSavedSearchesEnabled } from "@/lib/env";
import { useToast } from "@/lib/hooks/useToast";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import type { SearchFilters } from "@/lib/types/search";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

export const SaveSearchFAB = memo(function SaveSearchFAB(): React.ReactNode {
  const params = useSearchParams();
  const safeParams = params ?? new URLSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { showSuccess, ToastComponent } = useToast();
  const prefersReducedMotion = useReducedMotion();

  const query = safeParams.get("q") || "";
  const town = safeParams.get("town") || "";

  // Only show if query or town filters are active
  const hasActiveFilters = Boolean(query || town);

  // Check authentication status (hooks must be called before any early returns)
  useEffect(() => {
    // Early return if feature is disabled
    if (!isSavedSearchesEnabled()) {
      setIsAuthenticated(false);
      return;
    }

    const checkAuth = async (): Promise<void> => {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (err) {
        console.error("[SaveSearchFAB] Auth check error:", err);
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const supabase = createSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Reason: effect should only run once on mount to set up auth subscription
  }, []);

  const buildQueryString = useCallback((): string => {
    // Early return if feature is disabled
    if (!isSavedSearchesEnabled()) {
      return "";
    }
    const searchParams = new URLSearchParams();
    if (query) searchParams.set("q", query);
    if (town) searchParams.set("town", town);
    const age = safeParams.get("age") || "";
    const category = safeParams.get("category") || "";
    if (age) searchParams.set("age", age);
    if (category) searchParams.set("category", category);
    return searchParams.toString();
  }, [query, town, safeParams]);

  const handleSave = useCallback(async (): Promise<void> => {
    if (!isSavedSearchesEnabled()) {
      return;
    }

    // Show modal if not authenticated
    if (!isAuthenticated) {
      setShowModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const queryString = buildQueryString();
      const filters: SearchFilters = {};
      const age = params?.get("age");
      const category = params?.get("category");
      if (age) filters.age = age;
      if (category) filters.category = category;

      const response = await fetch("/api/search/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryString,
          town: town || null,
          filters: Object.keys(filters).length > 0 ? filters : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "AUTH_REQUIRED") {
          setShowModal(true);
          return;
        }
        throw new Error(data.error || "Failed to save search");
      }

      setIsSaved(true);
      showSuccess("Search saved — we'll notify you when new classes are added!");
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (err) {
      console.error("[SaveSearchFAB] Unexpected error:", err);
      // Ignore save errors in FAB; main button handles detailed messaging
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, buildQueryString, town, params]);


  const handleSuccess = useCallback(() => {
    // After successful magic link, the user will be redirected
    // The component will re-check auth status on mount
  }, []);

  // Early return if feature is disabled or no active filters (after all hooks)
  if (!isSavedSearchesEnabled() || !hasActiveFilters) {
    return null;
  }

  return (
    <>
      <motion.button
        onClick={handleSave}
        disabled={isSubmitting || isSaved}
        initial={prefersReducedMotion ? undefined : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={prefersReducedMotion ? undefined : { scale: 0, opacity: 0 }}
        whileHover={prefersReducedMotion ? {} : { scale: isSubmitting || isSaved ? 1 : 1.05, y: -2 }}
        whileTap={prefersReducedMotion ? {} : { scale: isSubmitting || isSaved ? 1 : 0.95 }}
        transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 20 }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-sage bg-sage px-5 py-3 text-small font-semibold text-white shadow-xl motion-safe:transition-all motion-safe:duration-200 motion-reduce:transition-none motion-reduce:animate-none hover:bg-sage/90 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Save this search"
        aria-busy={isSubmitting ? "true" : "false"}
      >
        <AnimatePresence mode="wait">
          {isSubmitting ? (
            <motion.div
              key="loading"
              initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
              transition={prefersReducedMotion ? { duration: 0 } : undefined}
              className="inline-flex items-center gap-2"
              role="status"
              aria-live="polite"
            >
              <Loader2 size={iconSize.md} aria-hidden="true" />
              <span className="hidden sm:inline">Saving...</span>
              <VisuallyHidden>Saving search...</VisuallyHidden>
            </motion.div>
          ) : isSaved ? (
            <motion.div
              key="saved"
              initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
              transition={prefersReducedMotion ? { duration: 0 } : undefined}
              className="inline-flex items-center gap-2"
            >
              <motion.div
                initial={prefersReducedMotion ? undefined : { scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 15 }}
              >
                <Bookmark size={iconSize.md} fill="currentColor" aria-hidden="true" />
              </motion.div>
              <span className="hidden sm:inline">Saved!</span>
            </motion.div>
          ) : (
            <motion.div
              key="save"
              initial={prefersReducedMotion ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : undefined}
              className="inline-flex items-center gap-2"
            >
              <Bookmark size={iconSize.md} aria-hidden="true" />
              <span className="hidden sm:inline">Save this search</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {ToastComponent}

      <SaveSearchPrompt
        open={showModal}
        onOpenChange={setShowModal}
        town={town}
        onSuccess={handleSuccess}
      />
    </>
  );
});

SaveSearchFAB.displayName = "SaveSearchFAB";

