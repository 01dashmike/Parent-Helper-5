/**
 * Search filter types used across search-related components
 */

/**
 * Search filters that can be saved and applied to searches.
 * These correspond to URL search parameters.
 */
export type SearchFilters = {
  age?: string;
  category?: string;
  day?: string;
  fromTime?: string;
  toTime?: string;
  radiusKm?: string;
  // Allow additional string filters for future extensibility
  [key: string]: string | undefined;
};

