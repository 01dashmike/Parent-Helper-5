"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const [value, setValue] = useState("");
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    router.push(`/classes/${slug}`);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: "easeOut" }}
      className="mx-auto mt-6 w-full max-w-xl"
    >
      <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md ring-1 ring-brand-sage/50 transition-transform duration-300 hover:scale-[1.01] focus-within:ring-2 focus-within:ring-brand-coral">
        <label className="sr-only" htmlFor="search-location">
          Search by location
        </label>
        <input
          id="search-location"
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Location"
          className="flex-1 bg-transparent text-sm text-brand-midnight placeholder-brand-midnight/40 outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-brand-coral px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-brand-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
        >
          Search
        </button>
      </div>
    </motion.form>
  );
}
