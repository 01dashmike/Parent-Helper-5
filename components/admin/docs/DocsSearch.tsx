"use client";

import { useState } from "react";
import { Search as SearchIcon } from "@/components/icons";

interface DocsSearchProps {
  onSearch: (query: string) => void;
}

export default function DocsSearch({ onSearch }: DocsSearchProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="relative">
        <input
          type="text"
          placeholder="Search documentation..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearch(e.target.value);
          }}
          className="w-full rounded border border-gray-300 px-4 py-2 pl-10 text-small focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <SearchIcon
          size={20}
          className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
        />
      </div>
    </form>
  );
}

