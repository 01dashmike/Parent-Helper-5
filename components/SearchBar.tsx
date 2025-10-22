"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const [value, setValue] = useState("");
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    router.push(`/classes/${slug}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-3 rounded-2xl bg-white/90 p-4 shadow-lg ring-1 ring-brand-sage/60 sm:flex-row sm:items-center"
    >
      <label className="sr-only" htmlFor="search-town">
        Search for classes by town
      </label>
      <input
        id="search-town"
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search classes by town"
        className="flex-1 rounded-xl border border-brand-sage/60 px-4 py-3 text-sm text-brand-teal shadow-sm focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-xl bg-brand-teal px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors duration-300 hover:bg-brand-coral focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
      >
        Search
      </button>
    </form>
  );
}
