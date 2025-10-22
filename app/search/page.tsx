"use client";

import { Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp } from "lucide-react";

import { FiltersSidebar } from "@/components/FiltersSidebar";
import { MapPanel } from "@/components/MapPanel";
import { ResultsList } from "@/components/ResultsList";
import { mockResults } from "@/data/mockResults";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useSearchStore } from "@/store/searchStore";

export default function SearchPage() {
  const setResults = useSearchStore((state) => state.setResults);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setResults(mockResults);
  }, [setResults]);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-brand-cream">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-brand-cream px-4 py-6 text-brand-teal">
            Loading filters…
          </div>
        }
      >
        <FiltersSidebar />
      </Suspense>
      <div className="flex-1 relative flex flex-col md:flex-row">
        <ResultsList />
        <MapPanel />
        <AnimatePresence>
          {showScrollTop && !isMobile && (
            <motion.button
              type="button"
              className="fixed bottom-10 right-10 z-30 rounded-full bg-brand-coral p-3 text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
              onClick={() =>
                window.scrollTo({ top: 0, behavior: shouldReduceMotion ? "auto" : "smooth" })
              }
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
              aria-label="Scroll to top"
            >
              <ArrowUp className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
