/**
 * Provider Growth Score Calculator
 * Composite metric combining multiple factors
 */

export interface GrowthScoreFactors {
  bookings: number;
  revenue: number;
  reviews: number;
  averageRating: number;
  listings: number;
  responseTime: number; // hours
  conversionRate: number; // percentage
  repeatBookings: number;
}

export interface GrowthScore {
  score: number; // 0-100
  factors: {
    bookings: number;
    revenue: number;
    engagement: number;
    quality: number;
  };
  breakdown: {
    bookingsScore: number;
    revenueScore: number;
    engagementScore: number;
    qualityScore: number;
  };
  nextBestActions: string[];
}

/**
 * Calculate Provider Growth Score
 */
export function calculateGrowthScore(factors: GrowthScoreFactors): GrowthScore {
  // Normalize and weight each factor
  const bookingsScore = Math.min((factors.bookings / 50) * 25, 25); // Max 25 points
  const revenueScore = Math.min((factors.revenue / 5000) * 25, 25); // Max 25 points (assuming £5000/month = max)
  
  // Engagement score (reviews + average rating)
  const reviewScore = Math.min((factors.reviews / 20) * 15, 15); // Max 15 points
  const ratingScore = ((factors.averageRating - 3) / 2) * 10; // 3-5 stars = 0-10 points
  const engagementScore = reviewScore + ratingScore;
  
  // Quality score (conversion rate, response time, repeat bookings)
  const conversionScore = (factors.conversionRate / 30) * 15; // Max 15 points (assuming 30% = max)
  const responseScore = Math.max(0, (48 - factors.responseTime) / 48) * 10; // Faster = better, max 10 points
  const repeatScore = Math.min((factors.repeatBookings / factors.bookings) * 10, 10); // Max 10 points
  const qualityScore = conversionScore + responseScore + repeatScore;
  
  const totalScore = bookingsScore + revenueScore + engagementScore + qualityScore;
  
  // Generate next best actions
  const nextBestActions = generateNextBestActions(factors, {
    bookingsScore,
    revenueScore,
    engagementScore,
    qualityScore,
  });
  
  return {
    score: Math.round(Math.min(totalScore, 100)),
    factors: {
      bookings: bookingsScore,
      revenue: revenueScore,
      engagement: engagementScore,
      quality: qualityScore,
    },
    breakdown: {
      bookingsScore: Math.round(bookingsScore),
      revenueScore: Math.round(revenueScore),
      engagementScore: Math.round(engagementScore),
      qualityScore: Math.round(qualityScore),
    },
    nextBestActions,
  };
}

/**
 * Generate AI-powered next best actions
 */
function generateNextBestActions(
  factors: GrowthScoreFactors,
  scores: {
    bookingsScore: number;
    revenueScore: number;
    engagementScore: number;
    qualityScore: number;
  }
): string[] {
  const actions: string[] = [];
  
  // Low bookings
  if (scores.bookingsScore < 10) {
    actions.push("Boost your listings visibility with featured placement");
    actions.push("Add more class times to increase availability");
  }
  
  // Low revenue
  if (scores.revenueScore < 10) {
    actions.push("Consider offering package deals or multi-class discounts");
    actions.push("Review your pricing strategy - are you competitive?");
  }
  
  // Low engagement
  if (scores.engagementScore < 15) {
    actions.push("Ask satisfied customers to leave reviews");
    actions.push("Respond to all reviews to show you care");
  }
  
  // Low quality
  if (scores.qualityScore < 15) {
    if (factors.responseTime > 24) {
      actions.push("Improve response time - aim for under 2 hours");
    }
    if (factors.conversionRate < 10) {
      actions.push("Optimize your class descriptions and photos");
    }
  }
  
  // High performers - growth actions
  if (scores.bookingsScore >= 20 && scores.revenueScore >= 20) {
    actions.push("Consider expanding to additional locations");
    actions.push("Launch referral program to grow organically");
  }
  
  // Ensure we always return 3 actions
  while (actions.length < 3) {
    actions.push("Keep up the great work! Continue engaging with your community");
  }
  
  return actions.slice(0, 3);
}

/**
 * Get growth score label
 */
export function getGrowthScoreLabel(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 80) {
    return {
      label: "Excellent",
      color: "text-green-600",
      description: "You're performing exceptionally well!",
    };
  } else if (score >= 60) {
    return {
      label: "Good",
      color: "text-blue-600",
      description: "Solid performance with room for growth",
    };
  } else if (score >= 40) {
    return {
      label: "Average",
      color: "text-yellow-600",
      description: "There's potential to improve your score",
    };
  } else {
    return {
      label: "Needs Improvement",
      color: "text-red-600",
      description: "Focus on the recommended actions below",
    };
  }
}

