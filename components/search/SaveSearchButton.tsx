"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookmarkCheck, Loader2, Star } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { SaveSearchPrompt } from "@/components/modals/SaveSearchPrompt";
import { isSavedSearchesEnabled } from "@/lib/env";
import { useToast } from "@/lib/hooks/useToast";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

export const SaveSearchButton = memo(function SaveSearchButton(): React.ReactNode {
  const params = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { showSuccess, showError, ToastComponent } = useToast();
  const prefersReducedMotion = useReducedMotion();

  const query = params?.get("q") || "";
  const town = params?.get("town") || "";
  const age = params?.get("age") || "";
  const category = params?.get("category") || "";

  // Check authentication status
  useEffect(() => {
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
        console.error("[SaveSearchButton] Auth check error:", err);
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
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (town) params.set("town", town);
    if (age) params.set("age", age);
    if (category) params.set("category", category);
    return params.toString();
  }, [query, town, age, category]);

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
      const filters: Record<string, string> = {};
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
    } catch (err: unknown) {
      console.error("[SaveSearchButton] Unexpected error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to save search";
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, buildQueryString, town, age, category]);


  const handleSuccess = useCallback(() => {
    // After successful magic link, the user will be redirected
    // The component will re-check auth status on mount
  }, []);

  if (!isSavedSearchesEnabled()) {
    return null;
  }

  return (
    <>
      <motion.button
        onClick={handleSave}
        disabled={isSubmitting || isSaved}
        whileHover={prefersReducedMotion ? {} : { scale: isSubmitting || isSaved ? 1 : 1.05 }}
        whileTap={prefersReducedMotion ? {} : { scale: isSubmitting || isSaved ? 1 : 0.95 }}
        transition={prefersReducedMotion ? { duration: 0 } : undefined}
        className="inline-flex items-center gap-2 rounded-full border border-sage/30 bg-white px-4 py-2 text-small font-semibold text-forest motion-safe:transition-all motion-safe:duration-200 motion-reduce:transition-none motion-reduce:animate-none hover:bg-sage/10 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
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
              <Loader2 size={iconSize.sm} aria-hidden="true" />
              <span>Saving...</span>
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
                initial={prefersReducedMotion ? undefined : { scale: 0 }}
                animate={prefersReducedMotion ? { scale: 1 } : { scale: [0, 1.2, 1] }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, type: "spring" }}
              >
                <BookmarkCheck size={iconSize.sm} aria-hidden="true" />
              </motion.div>
              <span>Saved</span>
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
              <Star size={iconSize.sm} aria-hidden="true" />
              <span>Save this search</span>
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

SaveSearchButton.displayName = "SaveSearchButton";

