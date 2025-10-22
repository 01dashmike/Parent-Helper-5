"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

import { useIsMobile } from "@/hooks/useMediaQuery";
import { useSearchStore, type SearchFilters } from "@/store/searchStore";

type SectionKey = "distance" | "category" | "age" | "mode";

export function FiltersSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();

  const { filters, results, setFilters } = useSearchStore((state) => ({
    filters: state.filters,
    results: state.results,
    setFilters: state.setFilters,
  }));

  const [distance, setDistance] = useState(filters.distance);
  const [categories, setCategories] = useState<string[]>(filters.categories);
  const [ageRange, setAgeRange] = useState<[number | "", number | ""]>(
    filters.ageRange ?? ["", ""]
  );
  const [mode, setMode] = useState<"online" | "in-person" | "any">(
    filters.isOnline === null ? "any" : filters.isOnline ? "online" : "in-person"
  );
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    distance: true,
    category: true,
    age: false,
    mode: true,
  });
  const [, startTransition] = useTransition();

  const availableCategories = useMemo(
    () => Array.from(new Set(results.map((result) => result.category))).sort(),
    [results]
  );

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCategoryToggle = (category: string) => {
    let nextCategories: string[] = [];
    setCategories((prev) => {
      nextCategories = prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category];
      return nextCategories;
    });
    return nextCategories;
  };

  const buildFilters = (overrides?: Partial<SearchFilters>) => {
    const base = {
      distance,
      categories,
      ageRange:
        ageRange[0] === "" || ageRange[1] === ""
          ? null
          : ([Number(ageRange[0]), Number(ageRange[1])] as [number, number]),
      isOnline: mode === "any" ? null : mode === "online",
    } satisfies SearchFilters;
    return overrides ? { ...base, ...overrides } : base;
  };

  const handleApply = (overrides?: Partial<SearchFilters>) => {
    const newFilters = buildFilters(overrides);

    setFilters(newFilters);

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("distance", String(newFilters.distance));
      params.set("mode", mode);
      if (newFilters.categories.length > 0) {
        params.set("categories", newFilters.categories.join(","));
      } else {
        params.delete("categories");
      }
      if (newFilters.ageRange) {
        params.set("ageMin", String(newFilters.ageRange[0]));
        params.set("ageMax", String(newFilters.ageRange[1]));
      } else {
        params.delete("ageMin");
        params.delete("ageMax");
      }
      router.replace(`?${params.toString()}`);
    });
  };

  const handleImmediateChange = (updater: () => void, overrides?: Partial<SearchFilters>) => {
    updater();
    if (!isMobile) {
      handleApply(overrides);
    }
  };

  const animation = {
    initial: { height: 0, opacity: 0 },
    animate: {
      height: "auto",
      opacity: 1,
      transition: { duration: shouldReduceMotion ? 0 : 0.3, ease: "easeOut" as const },
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: { duration: shouldReduceMotion ? 0 : 0.2, ease: "easeIn" as const },
    },
  };

  return (
    <aside className="w-full max-w-md border-b border-brand-sage/60 bg-brand-cream px-4 py-6 md:h-screen md:max-w-xs md:border-b-0 md:border-r md:px-6 md:py-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-brand-teal">Filters</h2>
        <button
          type="button"
          onClick={() => {
            setDistance(5);
            setCategories([]);
            setAgeRange(["", ""]);
            setMode("any");
            setFilters({ distance: 5, categories: [], ageRange: null, isOnline: null });
          }}
          className="text-sm font-medium text-brand-teal underline"
        >
          Reset
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <section>
          <button
            type="button"
            onClick={() => toggleSection("distance")}
            className="flex w-full items-center justify-between rounded-lg bg-white px-4 py-3 text-left text-brand-teal shadow-sm"
          >
            <span className="font-medium">Distance</span>
            <span aria-hidden>{openSections.distance ? "−" : "+"}</span>
          </button>
          <AnimatePresence initial={false}>
            {openSections.distance && (
              <motion.div {...animation} className="overflow-hidden">
                <div className="space-y-3 px-2 py-4 text-sm text-brand-teal">
                  <label htmlFor="distance" className="flex items-center justify-between">
                    <span>{distance} km</span>
                    <span className="text-brand-teal/60">Max distance</span>
                  </label>
                  <input
                    id="distance"
                    type="range"
                    min={1}
                    max={20}
                    value={distance}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      handleImmediateChange(() => setDistance(value), { distance: value });
                    }}
                    className="w-full accent-brand-coral"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section>
          <button
            type="button"
            onClick={() => toggleSection("category")}
            className="flex w-full items-center justify-between rounded-lg bg-white px-4 py-3 text-left text-brand-teal shadow-sm"
          >
            <span className="font-medium">Category</span>
            <span aria-hidden>{openSections.category ? "−" : "+"}</span>
          </button>
          <AnimatePresence initial={false}>
            {openSections.category && (
              <motion.div {...animation} className="overflow-hidden">
                <div className="space-y-3 px-2 py-4 text-sm text-brand-teal">
                  {availableCategories.map((category) => (
                    <label key={category} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={categories.includes(category)}
                        onChange={() => {
                          const next = handleCategoryToggle(category);
                          if (!isMobile) {
                            handleApply({ categories: next });
                          }
                        }}
                        className="h-4 w-4 rounded border-brand-teal text-brand-coral focus:ring-brand-coral"
                      />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section>
          <button
            type="button"
            onClick={() => toggleSection("age")}
            className="flex w-full items-center justify-between rounded-lg bg-white px-4 py-3 text-left text-brand-teal shadow-sm"
          >
            <span className="font-medium">Age Range</span>
            <span aria-hidden>{openSections.age ? "−" : "+"}</span>
          </button>
          <AnimatePresence initial={false}>
            {openSections.age && (
              <motion.div {...animation} className="overflow-hidden">
                <div className="flex items-center gap-4 px-2 py-4 text-sm text-brand-teal">
                  <label className="flex flex-col text-xs uppercase tracking-wide text-brand-teal/70">
                    Min Age
                    <input
                      type="number"
                      min={0}
                      value={ageRange[0]}
                      onChange={(event) => {
                        const value = event.target.value === "" ? "" : Number(event.target.value);
                        handleImmediateChange(() => setAgeRange(([, max]) => [value, max]), {
                          ageRange:
                            value === "" || ageRange[1] === ""
                              ? null
                              : ([Number(value), Number(ageRange[1])] as [number, number]),
                        });
                      }}
                      className="mt-1 w-20 rounded-lg border border-brand-sage/70 px-2 py-1"
                    />
                  </label>
                  <label className="flex flex-col text-xs uppercase tracking-wide text-brand-teal/70">
                    Max Age
                    <input
                      type="number"
                      min={0}
                      value={ageRange[1]}
                      onChange={(event) => {
                        const value = event.target.value === "" ? "" : Number(event.target.value);
                        handleImmediateChange(() => setAgeRange(([min]) => [min, value]), {
                          ageRange:
                            ageRange[0] === "" || value === ""
                              ? null
                              : ([Number(ageRange[0]), Number(value)] as [number, number]),
                        });
                      }}
                      className="mt-1 w-20 rounded-lg border border-brand-sage/70 px-2 py-1"
                    />
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section>
          <button
            type="button"
            onClick={() => toggleSection("mode")}
            className="flex w-full items-center justify-between rounded-lg bg-white px-4 py-3 text-left text-brand-teal shadow-sm"
          >
            <span className="font-medium">Session Type</span>
            <span aria-hidden>{openSections.mode ? "−" : "+"}</span>
          </button>
          <AnimatePresence initial={false}>
            {openSections.mode && (
              <motion.div {...animation} className="overflow-hidden">
                <div className="grid grid-cols-3 gap-2 px-2 py-4 text-sm">
                  {[
                    { key: "any", label: "Any" },
                    { key: "online", label: "Online" },
                    { key: "in-person", label: "In Person" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        handleImmediateChange(() => setMode(key as typeof mode), {
                          isOnline: key === "any" ? null : key === "online",
                        })
                      }
                      className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                        mode === key
                          ? "border-brand-teal bg-brand-teal text-white"
                          : "border-brand-sage/70 text-brand-teal hover:border-brand-teal"
                      }`}
                      aria-pressed={mode === key}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {isMobile && (
        <div className="pointer-events-auto sticky bottom-4 mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => handleApply()}
            className="w-full max-w-sm rounded-full bg-brand-coral px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            Apply filters
          </button>
        </div>
      )}
    </aside>
  );
}
