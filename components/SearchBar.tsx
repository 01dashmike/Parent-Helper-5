"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { onSearchSubmit } from "@/analytics/events";

export default function SearchBar() {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const suggestions = useMemo(() => ["Winchester", "Southampton", "Basingstoke"], []);
  const filteredSuggestions = useMemo(() => {
    const lowered = value.toLowerCase();
    if (!lowered) return suggestions;
    return suggestions.filter((item) => item.toLowerCase().startsWith(lowered));
  }, [suggestions, value]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSearchSubmit(trimmed);
    setIsFocused(false);
    router.push(`/search?location=${encodeURIComponent(trimmed)}`);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue(suggestion);
    onSearchSubmit(suggestion);
    setIsFocused(false);
    router.push(`/search?location=${encodeURIComponent(suggestion)}`);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: "easeOut" }}
      className="mx-auto mt-6 flex w-full max-w-lg flex-col items-center justify-center gap-3 sm:flex-row sm:gap-2"
    >
      <div className="relative w-full flex-1">
        <label className="sr-only" htmlFor="search-location">
          Search by location
        </label>
        <input
          id="search-location"
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setTimeout(() => setIsFocused(false), 120);
          }}
          placeholder="Enter location"
          className="flex-1 rounded-xl border border-brand-sage/70 bg-white p-3 text-sm text-brand-midnight shadow-sm focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal"
        />
        <AnimatePresence>
          {isFocused && filteredSuggestions.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              role="listbox"
              aria-label="Suggested locations"
              className="absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-brand-sage/60"
            >
              {filteredSuggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    role="option"
                    aria-selected={value.toLowerCase() === suggestion.toLowerCase()}
                    className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-brand-midnight transition-colors duration-200 ease-out hover:bg-brand-sage/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
                  >
                    <span>{suggestion}</span>
                    <span className="text-xs text-brand-midnight/60">Use this</span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      <motion.button
        type="submit"
        whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
        transition={
          shouldReduceMotion ? { duration: 0.2 } : { type: "spring", stiffness: 250, damping: 15 }
        }
        className="w-full rounded-xl bg-brand-teal px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors duration-300 hover:bg-brand-coral focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal sm:w-auto"
      >
        Search
      </motion.button>
    </motion.form>
  );
}
