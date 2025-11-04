'use client';

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const PLACEHOLDERS = [
  "Search a town or activity (e.g. 'London sensory')",
  "Try 'Manchester music classes'",
  "Find 'Bristol baby yoga'",
];

function rotatePlaceholder(index: number) {
  return PLACEHOLDERS[index % PLACEHOLDERS.length];
}

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setPlaceholderIndex((value) => value + 1);
      return;
    }

    router.push(`/classes/${encodeURIComponent(trimmed.toLowerCase())}`);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="group relative mx-auto flex w-full flex-col gap-3 rounded-full border border-white/60 bg-white/90 p-2 shadow-glow transition hover:shadow-xl sm:flex-row sm:items-center sm:gap-2"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <label className="flex flex-1 items-center gap-3 rounded-full bg-white px-5 py-3 text-slateSoft/80 group-hover:text-slateSoft">
        <span aria-hidden className="text-lg font-semibold text-primary">
          ✨
        </span>
        <span className="sr-only">Search for classes or locations</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={rotatePlaceholder(placeholderIndex)}
          className="flex-1 border-none bg-transparent text-base font-medium text-slateSoft placeholder:text-slateSoft/50 focus:outline-none"
          type="search"
          name="query"
          aria-label="Search for classes or locations"
        />
      </label>

      <button
        type="submit"
        className="rounded-full bg-gradient-to-r from-primary via-accent to-secondary px-7 py-3 text-sm font-semibold text-white shadow-soft transition hover:shadow-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        Explore classes
      </button>
    </motion.form>
  );
}
