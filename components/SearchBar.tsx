"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { onSearchSubmit } from "@/analytics/events";

export default function SearchBar() {
  const [value, setValue] = useState("");
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSearchSubmit(trimmed);
    router.push(`/search?location=${encodeURIComponent(trimmed)}`);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: "easeOut" }}
      className="mx-auto mt-6 flex w-full max-w-lg flex-col items-center justify-center gap-3 sm:flex-row sm:gap-2"
    >
      <label className="sr-only" htmlFor="search-location">
        Search by location
      </label>
      <input
        id="search-location"
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Enter location"
        className="flex-1 rounded-xl border border-gray-300 bg-white p-3 text-sm text-brand-midnight shadow-sm focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal"
      />
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
