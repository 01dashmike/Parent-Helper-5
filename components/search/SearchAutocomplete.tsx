"use client";

import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { safeFetch } from "@/lib/client/safeFetch";

type Suggestion = {
  id: number;
  name: string;
  type: "class" | "provider";
  town?: string | null;
  category?: string | null;
};

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchAutocomplete = memo(function SearchAutocomplete({
  value,
  onChange,
  onSubmit,
  placeholder = "Search a town or activity",
  className = "",
}: SearchAutocompleteProps) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(value, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch suggestions
  useEffect(() => {
    const query = debouncedQuery.trim();
    
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);

    safeFetch<{ suggestions: Suggestion[] }>(`/api/search/suggest?q=${encodeURIComponent(query)}`, {
      signal: abortControllerRef.current.signal,
    })
      .then((result) => {
        if (result.ok && result.data?.suggestions) {
          setSuggestions(result.data.suggestions);
          setIsOpen(result.data.suggestions.length > 0);
          setSelectedIndex(-1);
        } else {
          setSuggestions([]);
          setIsOpen(false);
        }
      })
      .catch(() => {
        setSuggestions([]);
        setIsOpen(false);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || suggestions.length === 0) {
        if (e.key === "Enter") {
          e.preventDefault();
          onSubmit(value);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            handleSelectSuggestion(suggestions[selectedIndex]);
          } else {
            onSubmit(value);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, suggestions, selectedIndex, value, onSubmit]
  );

  const handleSelectSuggestion = useCallback(
    (suggestion: Suggestion) => {
      onChange(suggestion.name);
      setIsOpen(false);
      setSelectedIndex(-1);
      
      // Navigate to search results
      if (suggestion.type === "class") {
        router.push(`/class/${suggestion.id}`);
      } else {
        router.push(`/classes/${encodeURIComponent(suggestion.name.toLowerCase())}`);
      }
    },
    [onChange, router]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    // Delay to allow click events on suggestions
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }, 200);
  };

  const clearInput = useCallback(() => {
    onChange("");
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }, [onChange]);

  // Memoize suggestion items to avoid recreating on every render
  const suggestionItems = useMemo(() => {
    return suggestions.map((suggestion, index) => (
      <button
        key={`${suggestion.type}-${suggestion.id}`}
        type="button"
        onClick={() => handleSelectSuggestion(suggestion)}
        className={`w-full px-4 py-3 text-left motion-safe:transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${
          index === selectedIndex
            ? "bg-sage/10 text-charcoal"
            : "text-charcoal hover:bg-cream/50"
        } ${index < suggestions.length - 1 ? "border-b border-sage/10" : ""}`}
        role="option"
        aria-selected={index === selectedIndex}
        tabIndex={index === selectedIndex ? 0 : -1}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              suggestion.type === "class" ? "bg-sage/20 text-sage" : "bg-purple/20 text-purple"
            }`}
          >
            {suggestion.type === "class" ? "📚" : "🏢"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-charcoal truncate">{suggestion.name}</div>
            <div className="text-small text-slateSoft truncate">
              {suggestion.type === "class" ? (
                <>
                  {suggestion.category && <span>{suggestion.category}</span>}
                  {suggestion.category && suggestion.town && <span> • </span>}
                  {suggestion.town && <span>{suggestion.town}</span>}
                </>
              ) : (
                suggestion.town && <span>{suggestion.town}</span>
              )}
            </div>
          </div>
        </div>
      </button>
    ));
  }, [suggestions, selectedIndex, handleSelectSuggestion]);

  return (
    <div className={`relative flex-1 ${className}`}>
      <div className="relative flex items-center w-full">
        <Search size={iconSize.md} className="absolute left-0 text-slateSoft/60 pointer-events-none" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="flex-1 w-full border-none bg-transparent pl-8 pr-10 text-body font-medium text-slateSoft placeholder:text-slateSoft/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
          aria-label="Search for classes or locations"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-haspopup="listbox"
        />
        {value && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute right-2 min-h-11 min-w-11 flex items-center justify-center rounded-full text-slateSoft/60 hover:text-slateSoft hover:bg-slateSoft/10 motion-safe:transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 md:min-h-0 md:min-w-0 md:h-6 md:w-6"
            aria-label="Clear search"
          >
            <X size={iconSize.sm} aria-hidden="true" />
          </button>
        )}
        {isLoading && !value && (
          <div className="absolute right-2 flex items-center">
            <div className="h-4 w-4 motion-safe:animate-spin motion-reduce:animate-none rounded-full border-2 border-slateSoft/30 border-t-slateSoft/60" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          id="search-suggestions"
          className="absolute z-50 top-full mt-2 w-full rounded-xl border border-sage/20 bg-white shadow-xl overflow-hidden"
          role="listbox"
          aria-label="Search suggestions"
        >
          {suggestionItems}
        </div>
      )}
    </div>
  );
});

SearchAutocomplete.displayName = "SearchAutocomplete";

