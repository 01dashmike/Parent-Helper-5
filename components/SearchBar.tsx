'use client';

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MotionForm } from "@/components/motion/MotionForm";
import { SearchAutocomplete } from "@/components/search/SearchAutocomplete";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Button } from "@/components/ui/button";

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
    <MotionForm
      onSubmit={handleSubmit}
      className="group relative mx-auto flex w-full flex-col gap-3 rounded-full border border-white/60 bg-white/90 p-2 shadow-glow motion-safe:transition-shadow motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none hover:shadow-xl sm:flex-row sm:items-center sm:gap-2"
      animation="scaleIn"
      delay={0}
      duration={0.4}
      fromScale={0.97}
    >
      <div className="flex flex-1 items-center gap-3">
        <span aria-hidden className="text-title font-semibold text-primary shrink-0">
          ✨
        </span>
        <VisuallyHidden>Search for classes or locations</VisuallyHidden>
        <SearchAutocomplete
          value={query}
          onChange={setQuery}
          onSubmit={(q) => {
            const trimmed = q.trim();
            if (trimmed) {
              router.push(`/classes/${encodeURIComponent(trimmed.toLowerCase())}`);
            }
          }}
          placeholder={rotatePlaceholder(placeholderIndex)}
          className="flex-1"
        />
      </div>

      <Button
        type="submit"
        size="sm"
        className="bg-gradient-to-r from-primary via-accent to-secondary text-white hover:shadow-glow"
        aria-label="Search for classes"
      >
        Explore classes
      </Button>
    </MotionForm>
  );
}
