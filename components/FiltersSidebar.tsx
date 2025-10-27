"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import { useIsMobile } from "@/hooks/useMediaQuery";
import { useSearchStore } from "@/store/searchStore";

interface FiltersSidebarProps {
  onClose?: () => void;
}

const CATEGORIES = [
  "All",
  "Parent & Baby",
  "Music & Movement",
  "Arts & Crafts",
  "Soft Play",
  "Swimming",
  "Dance & Drama",
  "Outdoors & Nature",
];

const sectionVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: "auto", opacity: 1 },
};

export default function FiltersSidebar({ onClose }: FiltersSidebarProps = {}) {
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const { radiusKm, category, setRadius, setCategory } = useSearchStore((state) => ({
    radiusKm: state.radiusKm,
    category: state.category,
    setRadius: state.setRadius,
    setCategory: state.setCategory,
  }));

  const [pendingRadius, setPendingRadius] = useState(radiusKm);
  const [pendingCategory, setPendingCategory] = useState(category || "All");

  useEffect(() => {
    if (!isMobile) {
      setPendingRadius(radiusKm);
      setPendingCategory(category || "All");
    }
  }, [radiusKm, category, isMobile]);

  const [expandedSections, setExpandedSections] = useState({
    distance: true,
    category: true,
  });

  const handleToggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const applyMobileFilters = () => {
    setRadius(pendingRadius);
    setCategory(pendingCategory === "All" ? "" : pendingCategory);
    onClose?.();
  };

  useEffect(() => {
    if (!isMobile) {
      setRadius(pendingRadius);
    }
  }, [pendingRadius, isMobile, setRadius]);

  useEffect(() => {
    if (!isMobile) {
      setCategory(pendingCategory === "All" ? "" : pendingCategory);
    }
  }, [pendingCategory, isMobile, setCategory]);

  const currentCategory = useMemo(() => (category ? category : "All"), [category]);

  const containerClass = isMobile
    ? "flex flex-col gap-6 rounded-3xl bg-white/80 p-5 shadow-sm backdrop-blur"
    : "sticky top-24 flex flex-col gap-6 rounded-3xl bg-white/80 p-5 shadow-sm backdrop-blur";

  const content = (
    <div className={containerClass}>
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal">
          <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-brand-textMuted">Refine your results</p>
          <h2 className="text-lg font-semibold text-brand-teal">Filters</h2>
        </div>
      </header>

      <div className="space-y-4">
        <Section
          title="Distance"
          isOpen={expandedSections.distance}
          onToggle={() => handleToggleSection("distance")}
        >
          <motion.div
            variants={sectionVariants}
            initial={false}
            animate={expandedSections.distance ? "expanded" : "collapsed"}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between text-sm text-brand-textMuted">
                <span>Within</span>
                <span className="font-semibold text-brand-teal">{pendingRadius} km</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={pendingRadius}
                onChange={(event) => setPendingRadius(Number(event.target.value))}
                className="w-full accent-brand-teal"
              />
              <p className="text-xs text-brand-textMuted">
                Adjust to widen or narrow the search radius.
              </p>
            </div>
          </motion.div>
        </Section>

        <Section
          title="Category"
          isOpen={expandedSections.category}
          onToggle={() => handleToggleSection("category")}
        >
          <motion.div
            variants={sectionVariants}
            initial={false}
            animate={expandedSections.category ? "expanded" : "collapsed"}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="grid gap-2 py-2">
              {CATEGORIES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPendingCategory(option)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    pendingCategory === option
                      ? "border-brand-teal bg-brand-teal text-white"
                      : "border-brand-sage/70 bg-white text-brand-textMuted hover:border-brand-teal/80 hover:text-brand-teal"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </motion.div>
        </Section>
      </div>

      {isMobile ? (
        <motion.button
          type="button"
          onClick={applyMobileFilters}
          whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          className="inline-flex w-full items-center justify-center rounded-full bg-brand-coral px-5 py-3 text-sm font-semibold text-white shadow-md transition-colors duration-300 hover:bg-brand-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
        >
          Apply Filters
        </motion.button>
      ) : null}

      <p className="text-xs leading-relaxed text-brand-textMuted">
        Showing activities within{" "}
        <span className="font-semibold text-brand-teal">{currentCategory}</span> at{" "}
        <span className="font-semibold text-brand-teal">{radiusKm} km</span> radius.
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <div className="mb-4">
        <AnimatePresence initial={false}>
          <motion.div
            key="filters-mobile"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: "easeOut" }}
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return <>{content}</>;
}

interface SectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, isOpen, onToggle, children }: SectionProps) {
  return (
    <div className="rounded-2xl border border-brand-sage/50 bg-white/70">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left font-medium text-brand-teal"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <span className="text-sm text-brand-textMuted">{isOpen ? "Hide" : "Show"}</span>
      </button>
      {children}
    </div>
  );
}
