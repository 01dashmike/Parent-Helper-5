"use client";

export type AnalyticsPayload = Record<string, unknown> | undefined;

export function logEvent(eventName: string, payload?: AnalyticsPayload) {
  // Placeholder analytics hook. Replace with actual analytics integration.
  console.log(`[Analytics] ${eventName}`, payload ?? {});
}

export const onSearchSubmit = (location: string) => {
  logEvent("search_submit", { location });
};

export const onFilterChange = (filters: AnalyticsPayload) => {
  logEvent("filter_change", filters);
};

export const onMapInteraction = (action: string, payload?: AnalyticsPayload) => {
  logEvent(`map_${action}`, payload);
};
