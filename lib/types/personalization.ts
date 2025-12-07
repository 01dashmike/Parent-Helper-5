/**
 * Personalization type definitions
 */

export interface RecommendationWeights {
  w_age_fit: number;
  w_distance: number;
  w_pop: number;
  w_quality: number;
  w_novelty: number;
}

export type PersonalizedClass = {
  id: number | string;
  title: string;
  description: string | null;
  category: string | null;
  town: string | null;
  age_range: string | null;
  latitude: number | null;
  longitude: number | null;
  score: number;
  rationale: string;
  provider_id?: number | null;
  provider_name?: string | null;
  dist_km?: number | null;
};

export type PersonalizedProvider = {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  town: string | null;
  category: string | null;
  score: number;
  rationale: string;
};

export type PersonalizationSignals = {
  searchHistory: number;
  viewedClasses: number;
  preferredCategories: string[];
  preferredLocations: string[];
  childAges: number[];
};

export type PersonalizationResult = {
  classes: PersonalizedClass[];
  providers: PersonalizedProvider[];
  signals: PersonalizationSignals;
};

