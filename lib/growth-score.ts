/**
 * Provider Growth Score Calculation
 * 
 * Formula:
 * growth_score = 
 *   (profile_completion * 0.10) +
 *   (listing_quality * 0.20) +
 *   (booking_activity * 0.30) +
 *   (reviews_score * 0.20) +
 *   (referral_activity * 0.20)
 */

export interface GrowthScoreMetrics {
  profile_completion: number; // 0-100
  listing_quality: number; // 0-100
  booking_activity: number; // 0-100
  reviews_score: number; // 0-100
  referral_activity: number; // 0-100
  reviewResponseRate?: number; // 0-100 percentage of reviews with responses
}

export interface GrowthScoreResult {
  growthScore: number; // 0-100
  metrics: GrowthScoreMetrics;
  tier: "Bronze" | "Silver" | "Gold" | "None";
  multiplier: number;
}

/**
 * Calculate referral activity score (0-100)
 * Rules:
 * - +5 points per referral registration
 * - +15 points per listing creation
 * - +30 points per first booking
 * Cap at 100
 */
export function calculateReferralActivityScore(
  registrations: number,
  listingsCreated: number,
  firstBookings: number
): number {
  const score = registrations * 5 + listingsCreated * 15 + firstBookings * 30;
  return Math.min(100, score);
}

/**
 * Calculate profile completion score (0-100)
 * Updated to weight photos more heavily
 */
export function calculateProfileCompletionScore(metrics: {
  hasDescription?: boolean;
  hasContactInfo?: boolean;
  hasClasses?: boolean;
  hasPhotos?: boolean;
  hasSocialLinks?: boolean;
}): number {
  let score = 0;
  if (metrics.hasDescription) score += 18;
  if (metrics.hasContactInfo) score += 18;
  if (metrics.hasClasses) score += 22;
  if (metrics.hasPhotos) score += 25; // Increased weight for photos
  if (metrics.hasSocialLinks) score += 17;
  return Math.min(100, score);
}

/**
 * Calculate listing quality score (0-100)
 */
export function calculateListingQualityScore(metrics: {
  totalClasses?: number;
  activeClasses?: number;
  avgClassRating?: number;
  classesWithPhotos?: number;
  classesWithDescriptions?: number;
}): number {
  let score = 0;
  const totalClasses = metrics.totalClasses || 0;
  const activeClasses = metrics.activeClasses || 0;
  
  if (totalClasses > 0) {
    score += Math.min(30, (activeClasses / totalClasses) * 30);
  }
  if (metrics.avgClassRating) {
    score += Math.min(30, (metrics.avgClassRating / 5) * 30);
  }
  if (metrics.classesWithPhotos && totalClasses > 0) {
    score += Math.min(20, (metrics.classesWithPhotos / totalClasses) * 20);
  }
  if (metrics.classesWithDescriptions && totalClasses > 0) {
    score += Math.min(20, (metrics.classesWithDescriptions / totalClasses) * 20);
  }
  
  return Math.min(100, score);
}

/**
 * Calculate booking activity score (0-100)
 * Updated to include conversion rate percentile weighting
 */
export function calculateBookingActivityScore(metrics: {
  totalBookings?: number;
  bookingsLast30Days?: number;
  revenueLast30Days?: number;
  conversionRate?: number;
  conversionRatePercentile?: number; // Optional percentile for relative scoring
}): number {
  let score = 0;
  
  // Total bookings (max 25 points)
  if (metrics.totalBookings) {
    score += Math.min(25, (metrics.totalBookings / 50) * 25);
  }
  
  // Recent activity (max 25 points)
  if (metrics.bookingsLast30Days) {
    score += Math.min(25, (metrics.bookingsLast30Days / 20) * 25);
  }
  
  // Revenue (max 15 points)
  if (metrics.revenueLast30Days) {
    score += Math.min(15, (metrics.revenueLast30Days / 1000) * 15);
  }
  
  // Conversion rate - use percentile if available, otherwise absolute (max 35 points)
  if (metrics.conversionRatePercentile !== undefined) {
    // Use percentile for relative scoring (0-100 percentile maps to 0-35 points)
    score += (metrics.conversionRatePercentile / 100) * 35;
  } else if (metrics.conversionRate) {
    // Fallback to absolute conversion rate (0-10% maps to 0-35 points)
    score += Math.min(35, (metrics.conversionRate / 10) * 35);
  }
  
  return Math.min(100, score);
}

/**
 * Calculate reviews score (0-100)
 * Includes review response rate bonus
 */
export function calculateReviewsScore(metrics: {
  reviewCount?: number;
  averageRating?: number;
  recentReviews?: number;
  reviewResponseRate?: number; // Percentage of reviews with responses
}): number {
  let score = 0;
  
  // Review count (max 40 points)
  if (metrics.reviewCount) {
    score += Math.min(40, (metrics.reviewCount / 10) * 40);
  }
  
  // Average rating (max 40 points)
  if (metrics.averageRating) {
    score += Math.min(40, (metrics.averageRating / 5) * 40);
  }
  
  // Recent reviews (max 20 points)
  if (metrics.recentReviews) {
    score += Math.min(20, (metrics.recentReviews / 5) * 20);
  }
  
  return Math.min(100, score);
}

/**
 * Calculate review response rate contribution to growth score
 * Returns bonus points based on response rate thresholds
 * 
 * @param reviewResponseRate - Percentage of reviews with responses (0-100)
 * @param config - Threshold configuration (default: 50% = +5 points, 80% = +10 points)
 * @returns Bonus points to add to growth score
 */
export function calculateReviewResponseBonus(
  reviewResponseRate: number,
  config: { threshold50?: number; threshold80?: number } = {}
): number {
  const { threshold50 = 5, threshold80 = 10 } = config;
  
  if (reviewResponseRate >= 80) {
    return threshold80; // +10 points for ≥80% response rate
  } else if (reviewResponseRate >= 50) {
    return threshold50; // +5 points for ≥50% response rate
  }
  
  return 0;
}

/**
 * Calculate overall Growth Score
 * Includes review response rate bonus
 */
export function calculateGrowthScore(metrics: GrowthScoreMetrics): GrowthScoreResult {
  let growthScore =
    metrics.profile_completion * 0.10 +
    metrics.listing_quality * 0.20 +
    metrics.booking_activity * 0.30 +
    metrics.reviews_score * 0.20 +
    metrics.referral_activity * 0.20;

  // Add review response rate bonus (up to +10 points)
  if (metrics.reviewResponseRate !== undefined) {
    const responseBonus = calculateReviewResponseBonus(metrics.reviewResponseRate);
    growthScore += responseBonus;
    // Cap at 100
    growthScore = Math.min(100, growthScore);
  }

  const roundedScore = Math.round(growthScore * 100) / 100;

  // Determine tier and multiplier
  let tier: "Bronze" | "Silver" | "Gold" | "None";
  let multiplier: number;

  if (roundedScore >= 80) {
    tier = "Gold";
    multiplier = 1.30;
  } else if (roundedScore >= 60) {
    tier = "Silver";
    multiplier = 1.15;
  } else if (roundedScore >= 40) {
    tier = "Bronze";
    multiplier = 1.05;
  } else {
    tier = "None";
    multiplier = 1.0;
  }

  return {
    growthScore: roundedScore,
    metrics,
    tier,
    multiplier,
  };
}

