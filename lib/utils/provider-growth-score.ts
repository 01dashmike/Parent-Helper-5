/**
 * Provider Growth Score Calculation
 * 
 * Composite score (0-100) based on:
 * - 40% Booking growth (vs previous week)
 * - 25% Conversion rate (bookings/views)
 * - 20% Profile completeness
 * - 15% Review average
 */

// TODO: Confirm external usage of this export before removing (lib/utils cleanup)
export interface ProviderMetrics {
  views: number;
  bookings: number;
  conversions: number;
  reviews: number;
  profile_completion: number; // 0-100
  review_average: number; // 0-5
  previous_week_bookings?: number;
}

// TODO: Confirm external usage of this export before removing (lib/utils cleanup)
export interface GrowthScoreResult {
  score: number; // 0-100
  breakdown: {
    bookingGrowth: number;
    conversionRate: number;
    profileCompleteness: number;
    reviewAverage: number;
  };
  metrics: ProviderMetrics;
}

/**
 * Calculate provider growth score
 * @param currentMetrics - Current week metrics
 * @param previousWeekMetrics - Optional previous week metrics for comparison
 * @returns Growth score result with breakdown
 */
export function calculateProviderGrowthScore(
  currentMetrics: ProviderMetrics,
  previousWeekMetrics?: Partial<ProviderMetrics>
): GrowthScoreResult {
  // 1. Booking Growth (40% weight)
  const previousBookings = previousWeekMetrics?.bookings || currentMetrics.previous_week_bookings || 0;
  const currentBookings = currentMetrics.bookings || 0;
  
  let bookingGrowthScore = 50; // Default to middle if no previous data
  if (previousBookings > 0) {
    const growthPercent = ((currentBookings - previousBookings) / previousBookings) * 100;
    // Normalize: -50% to +100% maps to 0-100
    bookingGrowthScore = Math.max(0, Math.min(100, 50 + growthPercent));
  } else if (currentBookings > 0) {
    // New provider with bookings gets bonus
    bookingGrowthScore = 75;
  }

  // 2. Conversion Rate (25% weight)
  const views = currentMetrics.views || 0;
  const conversions = currentMetrics.conversions || currentMetrics.bookings || 0;
  const conversionRate = views > 0 ? (conversions / views) * 100 : 0;
  // Normalize: 0-10% conversion rate maps to 0-100
  const conversionRateScore = Math.min(100, (conversionRate / 10) * 100);

  // 3. Profile Completeness (20% weight)
  const profileCompletenessScore = currentMetrics.profile_completion || 0;

  // 4. Review Average (15% weight)
  const reviewAverage = currentMetrics.review_average || 0;
  // Normalize: 0-5 stars maps to 0-100
  const reviewAverageScore = (reviewAverage / 5) * 100;

  // Calculate weighted composite score
  const compositeScore =
    bookingGrowthScore * 0.4 +
    conversionRateScore * 0.25 +
    profileCompletenessScore * 0.2 +
    reviewAverageScore * 0.15;

  return {
    score: Math.round(compositeScore * 100) / 100, // Round to 2 decimal places
    breakdown: {
      bookingGrowth: Math.round(bookingGrowthScore * 100) / 100,
      conversionRate: Math.round(conversionRateScore * 100) / 100,
      profileCompleteness: Math.round(profileCompletenessScore * 100) / 100,
      reviewAverage: Math.round(reviewAverageScore * 100) / 100,
    },
    metrics: currentMetrics,
  };
}

/**
 * Provider data shape for completeness calculation
 */
interface ProviderCompletenessData {
  name?: string | null;
  descriptionRaw?: string | null;
  descriptionOverride?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  website?: string | null;
  addressLine1?: string | null;
  postcode?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  images?: Array<unknown> | null;
}

/**
 * Calculate profile completeness percentage
 * @param provider - Provider data object
 * @returns Completeness percentage (0-100)
 */
export function calculateProfileCompleteness(provider: ProviderCompletenessData): number {
  const fields = [
    provider.name,
    provider.descriptionRaw || provider.descriptionOverride,
    provider.contactEmail,
    provider.contactPhone,
    provider.website,
    provider.addressLine1,
    provider.postcode,
    provider.latitude,
    provider.longitude,
  ];

  const filledFields = fields.filter((f) => f && String(f).trim().length > 0).length;
  const hasImages = provider.images && Array.isArray(provider.images) && provider.images.length > 0;

  // 9 fields + images = 10 total
  const totalFields = 10;
  const completedFields = filledFields + (hasImages ? 1 : 0);

  return Math.round((completedFields / totalFields) * 100);
}

