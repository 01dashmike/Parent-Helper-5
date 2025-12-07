/**
 * Provider Alerts Builder
 * 
 * Generates contextual alerts for the provider dashboard
 * Optimized with early returns and efficient condition checking
 */

import type { HeroDashboardResponse } from "./dashboard";

type AlertItem = HeroDashboardResponse["alerts"][number];

// Pre-defined alert templates (constants for better performance)
const ALERT_TEMPLATES = {
  ONBOARDING_INCOMPLETE: {
    id: "onboarding-incomplete",
    type: "warning" as const,
    title: "Finish setting up your profile",
    description: "Complete your setup to appear higher in search results and get more bookings.",
    ctaLabel: "Resume setup",
    ctaHref: "/provider/onboarding",
  },
  PAYMENTS_NOT_CONFIGURED: {
    id: "payments-not-configured",
    type: "warning" as const,
    title: "You haven't connected payments",
    description: "Connect payouts so you can receive payments directly from bookings.",
    ctaLabel: "Connect payments",
    ctaHref: "/provider/payouts",
  },
  NO_BOOKINGS: {
    id: "no-bookings",
    type: "info" as const,
    title: "You're getting views but no bookings",
    description: "Consider improving your description, photos, or pricing to convert more visitors into bookings.",
    ctaLabel: "Update classes",
    ctaHref: "/provider/classes",
  },
  LOW_CONVERSION: {
    id: "low-conversion",
    type: "info" as const,
    title: "Low conversion rate",
    description: "You're getting views but few bookings. Improve your listing quality to convert more visitors.",
    ctaLabel: "Improve listing",
    ctaHref: "/provider/classes",
  },
  NO_REVIEWS: {
    id: "no-reviews",
    type: "info" as const,
    title: "Encourage reviews from parents",
    description: "Reviews help build trust and increase bookings. Ask satisfied parents to leave a review.",
    ctaLabel: "View bookings",
    ctaHref: "/provider/bookings",
  },
  UNANSWERED_REVIEWS: {
    id: "unanswered-reviews",
    type: "warning" as const,
    title: "You have unanswered reviews",
    description: "Responding to reviews shows you care and can improve your reputation.",
    ctaLabel: "View reviews",
    ctaHref: "/provider/reviews",
  },
} as const;

export function buildProviderAlerts(input: {
  onboarding: { isComplete: boolean; missingSteps: string[] };
  metrics: HeroDashboardResponse["kpis"];
  quickStats: HeroDashboardResponse["quickStats"];
  payoutsConnected: boolean;
  hasReviews: boolean;
  hasUnansweredReviews: boolean;
}): HeroDashboardResponse["alerts"] {
  const alerts: AlertItem[] = [];
  
  // Extract frequently used values for better performance
  const { quickStats } = input;
  const viewsThisWeek = quickStats.views.thisWeek;
  const bookingsThisWeek = quickStats.bookings.thisWeek;
  const viewsChangePercent = quickStats.views.changePercent;
  const conversionRate = quickStats.conversionRate.thisWeek;

  // Use templates for better performance (avoid object creation)
  if (!input.onboarding.isComplete) {
    alerts.push(ALERT_TEMPLATES.ONBOARDING_INCOMPLETE);
  }

  if (!input.payoutsConnected) {
    alerts.push(ALERT_TEMPLATES.PAYMENTS_NOT_CONFIGURED);
  }

  // Zero bookings but some views
  if (bookingsThisWeek === 0 && viewsThisWeek > 0) {
    alerts.push(ALERT_TEMPLATES.NO_BOOKINGS);
  }

  // Declining views (check early return)
  if (viewsChangePercent !== null && viewsChangePercent < -20) {
    alerts.push({
      id: "declining-views",
      type: "warning",
      title: "Your views are declining",
      description: "Your listing visibility has dropped. Consider updating your profile or adding new classes.",
      ctaLabel: "Boost visibility",
      ctaHref: "/provider/marketing",
    });
  }

  // Low conversion rate (optimized condition checking)
  if (conversionRate > 0 && conversionRate < 2 && viewsThisWeek > 10) {
    alerts.push(ALERT_TEMPLATES.LOW_CONVERSION);
  }

  // No reviews
  if (!input.hasReviews && bookingsThisWeek > 0) {
    alerts.push(ALERT_TEMPLATES.NO_REVIEWS);
  }

  // Unanswered reviews
  if (input.hasUnansweredReviews) {
    alerts.push(ALERT_TEMPLATES.UNANSWERED_REVIEWS);
  }

  // Success: Good growth (combine conditions efficiently)
  const viewsChange = input.metrics.views.changePercent;
  const bookingsChange = input.metrics.bookings.changePercent;
  
  if (viewsChange !== null && viewsChange > 20 && bookingsChange !== null && bookingsChange > 10) {
    alerts.push({
      id: "strong-growth",
      type: "success",
      title: "Great growth this week!",
      description: `Your views are up ${viewsChange}% and bookings are up ${bookingsChange}%. Keep it up!`,
    });
  }

  // Return early if we have 5 or fewer (avoid slice operation)
  return alerts.length <= 5 ? alerts : alerts.slice(0, 5);
}


