/**
 * Recommended Actions Builder
 * 
 * Generates actionable recommendations for providers to improve their performance
 * Optimized with constants and efficient sorting
 */

import type { HeroDashboardResponse } from "./dashboard";

type ActionItem = HeroDashboardResponse["recommendedActions"][number];
type Impact = "low" | "medium" | "high";

// Impact order mapping (for efficient sorting)
const IMPACT_ORDER: Record<Impact, number> = { high: 3, medium: 2, low: 1 };

// Pre-defined action templates
const ACTION_TEMPLATES = {
  COMPLETE_PROFILE: {
    id: "complete-profile",
    title: "Complete your profile",
    description: "Providers with complete profiles get more visibility and bookings.",
    impact: "high" as const,
    estimatedLiftPercent: 20,
    ctaLabel: "Finish setup",
    ctaHref: "/provider/onboarding",
  },
  IMPROVE_PHOTOS: {
    id: "improve-photos",
    title: "Add more photos to your classes",
    description: "Listings with high-quality photos see significantly higher bookings.",
    impact: "high" as const,
    estimatedLiftPercent: 15,
    ctaLabel: "Update media",
    ctaHref: "/provider/classes",
  },
  IMPROVE_DESCRIPTION: {
    id: "improve-description",
    title: "Enhance your class descriptions",
    description: "Detailed descriptions help parents understand what makes your classes special.",
    impact: "medium" as const,
    estimatedLiftPercent: 10,
    ctaLabel: "Edit classes",
    ctaHref: "/provider/classes",
  },
  CONNECT_PAYMENTS: {
    id: "connect-payments",
    title: "Connect payments to receive payouts",
    description: "Set up Stripe to receive payments directly from bookings.",
    impact: "medium" as const,
    ctaLabel: "Connect payments",
    ctaHref: "/provider/payouts",
  },
} as const;

export function buildRecommendedActions(input: {
  growthScore: HeroDashboardResponse["growthScore"];
  kpis: HeroDashboardResponse["kpis"];
  quickStats: HeroDashboardResponse["quickStats"];
  onboarding: { isComplete: boolean; missingSteps: string[] };
}): HeroDashboardResponse["recommendedActions"] {
  const actions: ActionItem[] = [];
  
  // Extract frequently used values
  const { completeness, engagement } = input.growthScore;
  const { views, bookings, conversionRate } = input.quickStats;
  const viewsThisWeek = views.thisWeek;
  const bookingsThisWeek = bookings.thisWeek;
  const viewsChange = views.changePercent;
  const conversionRateThisWeek = conversionRate.thisWeek;

  // Use templates for better performance
  if (completeness < 80) {
    actions.push(ACTION_TEMPLATES.COMPLETE_PROFILE);
  }

  if (completeness < 90) {
    actions.push(ACTION_TEMPLATES.IMPROVE_PHOTOS);
  }

  if (completeness < 85) {
    actions.push(ACTION_TEMPLATES.IMPROVE_DESCRIPTION);
  }

  // Create second class
  if (bookingsThisWeek > 0 && bookingsThisWeek < 5) {
    actions.push({
      id: "add-class",
      title: "Create a second class",
      description: "Providers with multiple classes get more visibility and bookings.",
      impact: "high",
      estimatedLiftPercent: 25,
      ctaLabel: "Add class",
      ctaHref: "/provider/classes/new",
    });
  }

  // Improve engagement
  if (engagement < 50) {
    actions.push({
      id: "improve-engagement",
      title: "Boost your listing visibility",
      description: "Your engagement is low. Consider updating your profile or running a promotion.",
      impact: "medium",
      estimatedLiftPercent: 15,
      ctaLabel: "View analytics",
      ctaHref: "/provider/analytics",
    });
  }

  // Address declining metrics
  if (viewsChange !== null && viewsChange < -10) {
    actions.push({
      id: "address-decline",
      title: "Your visibility is declining",
      description: "Update your listings, add new photos, or consider featured placement.",
      impact: "high",
      estimatedLiftPercent: 20,
      ctaLabel: "Boost visibility",
      ctaHref: "/provider/marketing",
    });
  }

  // Low conversion
  if (conversionRateThisWeek > 0 && conversionRateThisWeek < 3 && viewsThisWeek > 20) {
    actions.push({
      id: "improve-conversion",
      title: "Improve your conversion rate",
      description: "You're getting views but few bookings. Review your pricing, description, and photos.",
      impact: "high",
      estimatedLiftPercent: 18,
      ctaLabel: "Optimize listing",
      ctaHref: "/provider/classes",
    });
  }

  // No bookings
  if (bookingsThisWeek === 0 && viewsThisWeek === 0) {
    actions.push({
      id: "get-first-booking",
      title: "Get your first booking",
      description: "Complete your profile, add photos, and ensure your classes are published.",
      impact: "high",
      estimatedLiftPercent: 30,
      ctaLabel: "Complete setup",
      ctaHref: "/provider/onboarding",
    });
  }

  // Connect payments
  if (bookingsThisWeek > 0) {
    actions.push(ACTION_TEMPLATES.CONNECT_PAYMENTS);
  }

  // Early return if 5 or fewer actions
  if (actions.length <= 5) {
    // Sort by impact using pre-computed order
    return actions.sort((a, b) => IMPACT_ORDER[b.impact] - IMPACT_ORDER[a.impact]);
  }

  // Sort and slice for more than 5 actions
  return actions
    .sort((a, b) => IMPACT_ORDER[b.impact] - IMPACT_ORDER[a.impact])
    .slice(0, 5);
}


