"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { onSearchSubmit } from "@/analytics/events";

const DEFAULT_LAT = 51.0629;
const DEFAULT_LNG = -1.3131;
const DEFAULT_RADIUS = 5;

export default function SearchBar() {
  const [value, setValue] = useState("");
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSearchSubmit(trimmed);
    const params = new URLSearchParams({
      q: trimmed,
      lat: DEFAULT_LAT.toString(),
      lng: DEFAULT_LNG.toString(),
      radiusKm: DEFAULT_RADIUS.toString(),
    });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.35, ease: "easeOut" }}
      className="mx-auto mt-4 flex w-full max-w-lg flex-col items-center justify-center gap-3 sm:flex-row sm:gap-2"
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
        className="w-full rounded-full border border-brand-sage/70 bg-white px-5 py-3 text-sm text-brand-midnight placeholder:text-brand-lavender/80 shadow-sm focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/60 sm:w-[60%] sm:max-w-md"
      />
      <motion.button
        type="submit"
        whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
        transition={
          shouldReduceMotion ? { duration: 0.2 } : { type: "spring", stiffness: 280, damping: 18 }
        }
        className="w-full rounded-full bg-brand-coral px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-300 hover:bg-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-coral focus:ring-offset-2 sm:w-auto"
      >
        Search
      </motion.button>
    </motion.form>
  );
}
