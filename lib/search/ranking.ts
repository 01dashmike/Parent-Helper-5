/**
 * Unified search ranking system
 * 
 * Calculates a composite score based on multiple factors:
 * - Distance: How close the class is to the search location
 * - Rating: Average rating/review score
 * - Relevance: How well the class matches the search query
 * - Popularity: Overall popularity metrics
 * - Price: Affordability score (lower price = higher score)
 */

export type RankingWeights = {
  distance: number;
  rating: number;
  relevance: number;
  popularity: number;
  price: number;
};

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  distance: 0.25,    // 25% - Proximity is important
  rating: 0.20,      // 20% - Quality matters
  relevance: 0.25,   // 25% - Match quality
  popularity: 0.15,  // 15% - Social proof
  price: 0.15,       // 15% - Affordability
};

/**
 * Normalize weights to sum to 1.0 (internal helper)
 */
function normalizeWeights(weights: Partial<RankingWeights>): RankingWeights {
  const merged = { ...DEFAULT_RANKING_WEIGHTS, ...weights };
  const sum = Object.values(merged).reduce((acc, val) => acc + val, 0);
  if (sum === 0) return DEFAULT_RANKING_WEIGHTS;
  
  return {
    distance: merged.distance / sum,
    rating: merged.rating / sum,
    relevance: merged.relevance / sum,
    popularity: merged.popularity / sum,
    price: merged.price / sum,
  };
}

/**
 * Get ranking weights from environment or use defaults
 */
export function getRankingWeights(): RankingWeights {
  const envWeights = process.env.SEARCH_RANKING_WEIGHTS;
  if (!envWeights) return DEFAULT_RANKING_WEIGHTS;
  
  try {
    const parsed = JSON.parse(envWeights) as Partial<RankingWeights>;
    return normalizeWeights(parsed);
  } catch (error) {
    console.warn("[ranking] Invalid SEARCH_RANKING_WEIGHTS, using defaults:", error);
    return DEFAULT_RANKING_WEIGHTS;
  }
}

/**
 * Calculate distance in kilometers between two coordinates using Haversine formula (internal helper)
 * Note: For most use cases, prefer PostGIS distance calculations in SQL for better performance
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Normalize distance to 0-1 score (closer = higher score)
 * Uses exponential decay: score = e^(-distance / decayFactor)
 */
export function normalizeDistanceScore(distanceKm: number | null, maxDistanceKm: number = 50): number {
  if (distanceKm === null || distanceKm === undefined) return 0.5; // Neutral score if no distance
  if (distanceKm < 0) return 1.0; // Same location
  if (distanceKm > maxDistanceKm) return 0.0; // Too far
  
  // Exponential decay: closer = higher score
  // At 0km: score = 1.0
  // At maxDistanceKm: score ≈ 0.0
  const decayFactor = maxDistanceKm / 3; // Adjusts curve steepness
  return Math.exp(-distanceKm / decayFactor);
}

/**
 * Normalize rating to 0-1 score
 * Assumes rating is 0-5 scale
 */
export function normalizeRatingScore(rating: number | null | undefined): number {
  if (rating === null || rating === undefined || rating === 0) return 0.0;
  // Normalize 0-5 to 0-1
  return Math.min(rating / 5.0, 1.0);
}

/**
 * Calculate relevance score based on query matching (internal helper)
 */
function calculateRelevanceScore(
  query: string,
  classData: {
    title?: string | null;
    name?: string | null;
    description?: string | null;
    category?: string | null;
    main_category?: string | null;
    town?: string | null;
  }
): number {
  if (!query || query.trim().length === 0) return 1.0; // No query = all relevant
  
  const queryLower = query.toLowerCase().trim();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
  
  if (queryWords.length === 0) return 1.0;
  
  let score = 0.0;
  let maxScore = 0.0;
  
  // Title/name match (highest weight)
  const title = (classData.title || classData.name || "").toLowerCase();
  queryWords.forEach(word => {
    maxScore += 0.4;
    if (title.includes(word)) {
      score += 0.4;
    } else if (title.startsWith(word)) {
      score += 0.35; // Partial credit for prefix match
    }
  });
  
  // Category match (high weight)
  const category = (classData.category || classData.main_category || "").toLowerCase();
  queryWords.forEach(word => {
    maxScore += 0.3;
    if (category.includes(word)) {
      score += 0.3;
    }
  });
  
  // Description match (medium weight)
  const description = (classData.description || "").toLowerCase();
  queryWords.forEach(word => {
    maxScore += 0.2;
    if (description.includes(word)) {
      score += 0.2;
    }
  });
  
  // Town match (low weight, but still relevant)
  const town = (classData.town || "").toLowerCase();
  queryWords.forEach(word => {
    maxScore += 0.1;
    if (town.includes(word)) {
      score += 0.1;
    }
  });
  
  // Normalize to 0-1
  return maxScore > 0 ? Math.min(score / maxScore, 1.0) : 1.0;
}

/**
 * Normalize popularity to 0-1 score (internal helper)
 * Uses logarithmic scaling to handle wide ranges
 */
function normalizePopularityScore(popularity: number | null | undefined): number {
  if (popularity === null || popularity === undefined || popularity === 0) return 0.0;
  
  // Logarithmic scaling: log(1 + popularity) / log(1 + maxPopularity)
  // Assumes max popularity around 10000 for normalization
  const maxPopularity = 10000;
  const normalized = Math.log(1 + popularity) / Math.log(1 + maxPopularity);
  return Math.min(normalized, 1.0);
}

/**
 * Parse price from text and normalize to 0-1 score (lower price = higher score)
 * Handles various formats: "£10", "£10-15", "Free", "From £5", etc. (internal helper)
 */
function normalizePriceScore(priceText: string | null | undefined): number {
  if (!priceText || priceText.trim().length === 0) return 0.5; // Neutral if no price
  
  const text = priceText.toLowerCase().trim();
  
  // Free = highest score
  if (text.includes("free") || text === "£0" || text === "0") {
    return 1.0;
  }
  
  // Extract numbers (assumes prices are in £)
  const numbers = text.match(/£?\s*(\d+(?:\.\d+)?)/g);
  if (!numbers || numbers.length === 0) return 0.5; // Can't parse = neutral
  
  // Get the first (or lowest) price
  const prices = numbers.map(n => {
    const match = n.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  }).filter((p): p is number => p !== null);
  
  if (prices.length === 0) return 0.5;
  
  const minPrice = Math.min(...prices);
  
  // Normalize: lower price = higher score
  // Assumes typical range: £0-50 per session
  // Score = 1.0 for £0, decreases to ~0.0 for £50+
  const maxPrice = 50;
  if (minPrice >= maxPrice) return 0.0;
  
  // Inverse relationship: score = 1 - (price / maxPrice)
  return Math.max(1.0 - (minPrice / maxPrice), 0.0);
}

export type RankingInput = {
  // Class data
  classItem: {
    id: number;
    title?: string | null;
    name?: string | null;
    description?: string | null;
    category?: string | null;
    main_category?: string | null;
    town?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    rating?: number | string | null;
    review_count?: number | null;
    popularity?: number | null;
    price?: string | null;
    // Featured/boost data
    is_featured?: boolean;
    featured_priority?: number | null;
    featured_status?: string | null;
    featured_starts_at?: string | null;
    featured_ends_at?: string | null;
    provider_id?: number | null;
  };
  // Search context
  searchQuery: string;
  searchLatitude?: number;
  searchLongitude?: number;
  // Boost factors (from existing system)
  planBoost?: number;
  hasActiveBoost?: boolean;
  listingStatus?: string | null;
  // Monetisation boosts
  hasFeaturedListing?: boolean;
  hasVerifiedBadge?: boolean;
  featuredPriority?: number;
};

export type RankingResult = {
  totalScore: number;
  componentScores: {
    distance: number;
    rating: number;
    relevance: number;
    popularity: number;
    price: number;
  };
  normalizedScores: {
    distance: number;
    rating: number;
    relevance: number;
    popularity: number;
    price: number;
  };
};

/**
 * Calculate unified ranking score for a class
 */
export function calculateRankingScore(
  input: RankingInput,
  weights: RankingWeights = DEFAULT_RANKING_WEIGHTS
): RankingResult {
  const { classItem, searchQuery, searchLatitude, searchLongitude } = input;
  
  // Calculate distance score
  let distanceKm: number | null = null;
  if (
    searchLatitude &&
    searchLongitude &&
    classItem.latitude !== null &&
    classItem.latitude !== undefined &&
    classItem.longitude !== null &&
    classItem.longitude !== undefined
  ) {
    const lat = typeof classItem.latitude === "string" 
      ? parseFloat(classItem.latitude) 
      : classItem.latitude;
    const lng = typeof classItem.longitude === "string"
      ? parseFloat(classItem.longitude)
      : classItem.longitude;
    
    if (!isNaN(lat) && !isNaN(lng)) {
      distanceKm = calculateDistance(searchLatitude, searchLongitude, lat, lng);
    }
  }
  const distanceScore = normalizeDistanceScore(distanceKm);
  
  // Calculate rating score
  const rating = classItem.rating 
    ? (typeof classItem.rating === "string" ? parseFloat(classItem.rating) : classItem.rating)
    : null;
  const ratingScore = normalizeRatingScore(rating);
  
  // Calculate relevance score
  const relevanceScore = calculateRelevanceScore(searchQuery, {
    title: classItem.title,
    name: classItem.name,
    description: classItem.description,
    category: classItem.category,
    main_category: classItem.main_category,
    town: classItem.town,
  });
  
  // Calculate popularity score
  const popularityScore = normalizePopularityScore(classItem.popularity ?? null);
  
  // Calculate price score
  const priceScore = normalizePriceScore(classItem.price ?? null);
  
  // Calculate weighted total score
  const totalScore =
    distanceScore * weights.distance +
    ratingScore * weights.rating +
    relevanceScore * weights.relevance +
    popularityScore * weights.popularity +
    priceScore * weights.price;
  
  // Apply boost multipliers (from existing system + monetisation)
  let boostedScore = totalScore;
  
  // Featured Listing boost (monetisation layer)
  if (input.hasFeaturedListing) {
    const priority = input.featuredPriority ?? 0;
    // Base 1.5x boost, up to 2.5x with priority
    boostedScore *= 1.5 + (priority * 0.1);
  }
  // Verified Badge boost (monetisation layer)
  else if (input.hasVerifiedBadge) {
    // 1.3x boost for verified providers
    boostedScore *= 1.3;
  }
  // Active paid boost (legacy system)
  else if (input.hasActiveBoost) {
    boostedScore *= 2.0;
  }
  // Plan boost (legacy system)
  else if (input.planBoost && input.planBoost > 0) {
    boostedScore *= 1.5;
  }
  // Legacy featured listing
  else if (
    classItem.is_featured &&
    (classItem.featured_status ?? "standard") === "active" &&
    input.listingStatus === "active"
  ) {
    const priority = classItem.featured_priority ?? 0;
    boostedScore *= 1.2 + (priority * 0.1); // 1.2x to 2.2x based on priority
  }
  
  return {
    totalScore: boostedScore,
    componentScores: {
      distance: distanceKm ?? -1,
      rating: rating ?? 0,
      relevance: relevanceScore,
      popularity: classItem.popularity ?? 0,
      price: priceScore,
    },
    normalizedScores: {
      distance: distanceScore,
      rating: ratingScore,
      relevance: relevanceScore,
      popularity: popularityScore,
      price: priceScore,
    },
  };
}

