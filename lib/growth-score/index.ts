/**
 * Growth Score Utilities - Performance Optimized
 * 
 * This module provides utilities for managing provider growth scores
 * with optimal performance characteristics.
 * 
 * @module lib/growth-score
 */

export { checkProviderHasPhotos } from "./checkHasPhotos";
export { 
  recomputeProviderGrowthScore, 
  batchRecomputeProviderGrowthScores 
} from "./recompute";

// Re-export types from gamification module for convenience
export type {
  GrowthScoreMetrics,
  GrowthScoreResult,
} from "@/lib/gamification/growth-score";

export {
  calculateGrowthScore,
  calculateProfileCompletionScore,
  calculateListingQualityScore,
  calculateBookingActivityScore,
  calculateReviewsScore,
  calculateReferralActivityScore,
} from "@/lib/gamification/growth-score";







