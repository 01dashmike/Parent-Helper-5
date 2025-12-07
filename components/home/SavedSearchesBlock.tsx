"use client";

import LinkComponent from "@/components/ui/link";
import { Search, Clock } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { format as formatDate } from "date-fns";
import type { SearchFilters } from "@/lib/types/search";
import { CardContainer, CardHeader, CardBody } from "@/components/cards";
import { List, ListItem } from "@/components/lists";

type SavedSearch = {
  id: string;
  query: string;
  town: string | null;
  filters: SearchFilters | null;
  created_at: string;
};

type SavedSearchesBlockProps = {
  searches: SavedSearch[];
};

export function SavedSearchesBlock({ searches }: SavedSearchesBlockProps) {
  // Only show if there are saved searches
  if (!searches || searches.length === 0) {
    return null;
  }

  // Show last 3 saved searches
  const recentSearches = searches.slice(0, 3);

  const buildSearchUrl = (search: SavedSearch) => {
    const params = new URLSearchParams();
    if (search.query) params.set("q", search.query);
    if (search.town) params.set("town", search.town);
    
    // Add filters if they exist
    if (search.filters) {
      Object.entries(search.filters).forEach(([key, value]) => {
        if (value) params.set(key, String(value));
      });
    }
    
    return `/search?${params.toString()}`;
  };

  const formatSearchLabel = (search: SavedSearch) => {
    const parts: string[] = [];
    if (search.query) parts.push(search.query);
    if (search.town) parts.push(`in ${search.town}`);
    return parts.length > 0 ? parts.join(" ") : "Saved search";
  };

  return (
    <CardContainer bgVariant="cream">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search size={iconSize.sm} className="text-sage" aria-hidden="true" />
            <h3 className="text-small font-semibold text-charcoal">Saved Searches</h3>
          </div>
          <LinkComponent
            href="/account/searches"
            className="text-body text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            prefetch={false}
          >
            View all
          </LinkComponent>
        </div>
      </CardHeader>
      <CardBody padding="none">
        <List 
          aria-label="Saved searches"
          className="space-y-2 p-2"
        >
          {recentSearches.map((search) => (
            <ListItem
              key={search.id}
              interactive
              className="group rounded-card border border-sage/10 bg-white/60 p-2.5 transition hover:bg-white hover:shadow-card"
            >
              <LinkComponent
                href={buildSearchUrl(search)}
                className="flex items-center justify-between w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                aria-label={`${formatSearchLabel(search)}, saved on ${formatDate(new Date(search.created_at), "MMM d")}`}
                prefetch={false}
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-small font-medium text-charcoal group-hover:text-sage">
                    {formatSearchLabel(search)}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-small text-slateSoft">
                    <Clock size={iconSize.sm} aria-hidden="true" />
                    <span>
                      {formatDate(new Date(search.created_at), "MMM d")}
                    </span>
                  </div>
                </div>
                <Search size={iconSize.sm} className="ml-2 flex-shrink-0 text-brand opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
              </LinkComponent>
            </ListItem>
          ))}
        </List>
      </CardBody>
    </CardContainer>
  );
}

