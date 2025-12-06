/**
 * Centralized environment access utilities
 */

export function isDev() {
  return process.env.NODE_ENV !== "production";
}

/* ------------------------------
   FEATURE FLAGS
------------------------------ */

function getBooleanFlag(
  envName: string,
  {
    publicName,
    defaultValue = false,
  }: { publicName?: string; defaultValue?: boolean } = {},
) {
  // Prefer explicit public flag when provided
  if (publicName) {
    const publicValue = process.env[publicName];
    if (publicValue === "true") return true;
    if (publicValue === "false") return false;
  }

  const value = process.env[envName];
  if (value === "true") return true;
  if (value === "false") return false;
  return defaultValue;
}

// City pages (client + server)
export function isCityPagesEnabled() {
  return getBooleanFlag("CITY_PAGES_ENABLED", {
    publicName: "NEXT_PUBLIC_CITY_PAGES_ENABLED",
  });
}

// Personalization (client + server)
export function isPersonalizationEnabled() {
  return getBooleanFlag("PERSONALIZATION_ENABLED", {
    publicName: "NEXT_PUBLIC_PERSONALIZATION_ENABLED",
  });
}

// Child profiles (client + server) - alias for personalization
export function isChildProfilesEnabled() {
  return isPersonalizationEnabled();
}

// Growth automation dashboard (admin UI + APIs)
export function isGrowthAutomationDashboardEnabled() {
  return getBooleanFlag("GROWTH_AUTOMATION_DASHBOARD_ENABLED");
}

// AI performance coach (admin UI + APIs)
export function isAIPerformanceCoachEnabled() {
  return getBooleanFlag("AI_PERFORMANCE_COACH_ENABLED", {
    publicName: "NEXT_PUBLIC_AI_PERFORMANCE_COACH_ENABLED",
  });
}

// Weather widget (client)
export function isWeatherWidgetEnabled() {
  return getBooleanFlag("WEATHER_WIDGET_ENABLED", {
    publicName: "NEXT_PUBLIC_WEATHER_WIDGET_ENABLED",
  });
}

// PWA push notifications (client + account navigation)
export function isPWAPushEnabled() {
  return getBooleanFlag("PWA_PUSH_ENABLED", {
    publicName: "NEXT_PUBLIC_PWA_PUSH_ENABLED",
  });
}

// Family wallet (server APIs + navigation)
export function isFamilyWalletEnabled() {
  return getBooleanFlag("FAMILY_WALLET_ENABLED", {
    publicName: "NEXT_PUBLIC_FAMILY_WALLET_ENABLED",
  });
}

// Account area overall toggle (server layout)
export function isAccountEnabled() {
  // Default: enabled unless explicitly disabled
  const publicValue = process.env.NEXT_PUBLIC_ACCOUNT_ENABLED;
  if (publicValue === "false") return false;
  if (publicValue === "true") return true;
  return true;
}

// Members area (client nav)
export function isMembersEnabled() {
  const value = process.env.NEXT_PUBLIC_MEMBERS_ENABLED;
  if (value === "false") return false;
  if (value === "true") return true;
  return true;
}

// Bookings feature (server APIs + class page)
export function isBookingsFeatureEnabled() {
  return getBooleanFlag("FEATURE_BOOKINGS");
}

// Reviews feature (class page + APIs)
export function isReviewsFeatureEnabled() {
  return getBooleanFlag("REVIEWS_FEATURE_ENABLED");
}

// Class Q&A feature (class page + admin)
export function isClassQAEnabled() {
  return getBooleanFlag("CLASS_QA_ENABLED");
}

// Topic hubs (topics pages + APIs)
export function isTopicHubsEnabled() {
  return getBooleanFlag("TOPIC_HUBS_ENABLED");
}

// Saved searches (client + APIs)
export function isSavedSearchesEnabled() {
  return getBooleanFlag("SAVED_SEARCHES_ENABLED");
}

// Nearby events (client + APIs)
export function isNearbyEventsEnabled() {
  return getBooleanFlag("NEARBY_EVENTS_ENABLED", {
    publicName: "NEXT_PUBLIC_NEARBY_EVENTS_ENABLED",
  });
}

// Local tips (city pages + APIs)
export function isLocalTipsEnabled() {
  return getBooleanFlag("LOCAL_TIPS_ENABLED", {
    publicName: "NEXT_PUBLIC_LOCAL_TIPS_ENABLED",
  });
}

// Local partners (city pages + APIs)
export function isLocalPartnersEnabled() {
  return getBooleanFlag("LOCAL_PARTNERS_ENABLED", {
    publicName: "NEXT_PUBLIC_LOCAL_PARTNERS_ENABLED",
  });
}

// Magic link sign-in
export function isMagicLinkSigninEnabled() {
  return getBooleanFlag("MAGIC_LINK_SIGNIN_ENABLED");
}

// Weekly alerts cron
export function isWeeklyAlertsEnabled() {
  return getBooleanFlag("WEEKLY_ALERTS_ENABLED");
}

// Newsletter personalisation
export function isNewsletterEnabled() {
  return getBooleanFlag("NEWSLETTER_ENABLED");
}

// Provider referrals dashboard
export function isProviderReferralsEnabled() {
  return getBooleanFlag("PROVIDER_REFERRALS_ENABLED");
}

// Marketing automation
export function isMarketingAutomationEnabled() {
  return getBooleanFlag("MARKETING_AUTOMATION_ENABLED");
}

// Analytics retention / engagement
export function isAnalyticsRetentionEnabled() {
  return getBooleanFlag("ANALYTICS_RETENTION_ENABLED");
}

// Reactivation emails
export function isReactivationEmailsEnabled() {
  return getBooleanFlag("REACTIVATION_EMAILS_ENABLED");
}

// AI Insights (admin dashboards + APIs)
export function isAIInsightsEnabled() {
  return getBooleanFlag("AI_INSIGHTS_ENABLED", {
    publicName: "NEXT_PUBLIC_AI_INSIGHTS_ENABLED",
  });
}

// Auto-recommendations on sign-in
export function isAutoRecsOnSigninEnabled() {
  return getBooleanFlag("AUTO_RECS_ON_SIGNIN_ENABLED");
}

// Frontend tracking
export function isTrackingEnabled() {
  return getBooleanFlag("TRACKING_ENABLED", {
    publicName: "NEXT_PUBLIC_TRACKING_ENABLED",
  });
}

// Growth dashboard (admin UI)
export function isGrowthDashboardEnabled() {
  return getBooleanFlag("GROWTH_DASHBOARD_ENABLED");
}

// Referral analytics (admin UI)
export function isReferralAnalyticsEnabled() {
  return getBooleanFlag("REFERRAL_ANALYTICS_ENABLED");
}

// Export data feature
export function isExportDataEnabled() {
  return getBooleanFlag("EXPORT_DATA_ENABLED");
}

// Demo feature
export function isDemoEnabled() {
  return getBooleanFlag("DEMO_ENABLED");
}

// Provider analytics (admin UI)
export function isProviderAnalyticsEnabled() {
  return getBooleanFlag("PROVIDER_ANALYTICS_ENABLED");
}

// Bulk scheduling feature
export function isBulkSchedulingEnabled() {
  return getBooleanFlag("BULK_SCHEDULING_ENABLED");
}

// Tips Studio feature
export function isTipsStudioEnabled() {
  return getBooleanFlag("TIPS_STUDIO_ENABLED", {
    publicName: "NEXT_PUBLIC_TIPS_STUDIO_ENABLED",
  });
}

// Recommendation weights and radius
export type RecommendationWeights = {
  w_age_fit: number;
  w_distance: number;
  w_pop: number;
  w_quality: number;
  w_novelty: number;
  w_category?: number; // Optional for backward compatibility
};

export function getRecsWeights(): RecommendationWeights {
  // Default weights for recommendation scoring
  return {
    w_age_fit: 0.3,
    w_distance: 0.2,
    w_pop: 0.2,
    w_quality: 0.2,
    w_novelty: 0.1,
  };
}

export function getRecsMaxRadiusKm(): number {
  // Default max radius in kilometers
  return Number(process.env.RECS_MAX_RADIUS_KM) || 25;
}

/* ------------------------------
   SUPABASE — BROWSER
------------------------------ */

export function hasSupabaseBrowserEnv() {
  return (
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
    typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string"
  );
}

export function getSupabaseBrowserUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

export function getSupabaseBrowserKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
}

/* ------------------------------
   SUPABASE — SERVER
------------------------------ */

export function getSupabaseServerUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

export function getSupabaseServerKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
  );
}

export function hasSupabaseServerEnv() {
  return Boolean(
    process.env.SUPABASE_URL ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY,
  );
}

/* ------------------------------
   LEGACY FALLBACK EXPORTS
------------------------------ */

// Some parts of your app expect default export in older code
const env = {
  isDev,
  isCityPagesEnabled,
  isPersonalizationEnabled,
  isGrowthAutomationDashboardEnabled,
  isAIPerformanceCoachEnabled,
  isWeatherWidgetEnabled,
  isPWAPushEnabled,
  isFamilyWalletEnabled,
  isAccountEnabled,
  isMembersEnabled,
  isBookingsFeatureEnabled,
  isReviewsFeatureEnabled,
  isClassQAEnabled,
  isTopicHubsEnabled,
  isSavedSearchesEnabled,
  isNearbyEventsEnabled,
  isLocalTipsEnabled,
  isLocalPartnersEnabled,
  isMagicLinkSigninEnabled,
  isWeeklyAlertsEnabled,
  isNewsletterEnabled,
  isProviderReferralsEnabled,
  isMarketingAutomationEnabled,
  isAnalyticsRetentionEnabled,
  isReactivationEmailsEnabled,
  isAIInsightsEnabled,
  isAutoRecsOnSigninEnabled,
  isTrackingEnabled,
  hasSupabaseBrowserEnv,
  getSupabaseBrowserUrl,
  getSupabaseBrowserKey,
  getSupabaseServerUrl,
  getSupabaseServerKey,
  hasSupabaseServerEnv,
};

export default env;
