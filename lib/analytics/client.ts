/**
 * Client-side analytics exports
 * Re-exports analytics functions that are safe for client components
 * All functions are wrapped in try/catch to prevent breaking the app
 */

export {
  logSearchPerformed,
  logSearch,
  logClassViewed,
  logCtaClick,
  logMapInteraction,
  logBlogView,
  logClassInteraction,
  logFilterChange,
  logPageView,
  flushAnalytics,
} from "../analytics";

