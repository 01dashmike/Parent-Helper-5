/**
 * Zod schemas for API response validation
 * Ensures all API responses match expected structure before being used by UI
 */

import { z } from "zod";

// ============================================================================
// Search Results Schema
// ============================================================================

export const FeaturedInfoSchema = z.object({
  isBoosted: z.boolean().optional(),
  hasPlan: z.boolean().optional(),
  planSlug: z.string().nullable().optional(),
  budgetOk: z.boolean().optional(),
  windowActive: z.boolean().optional(),
  listingStatus: z.string().nullable().optional(),
}).nullable().optional();

export const ClassResultSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string(),
  description: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  category: z.string().nullable().optional(),
  town: z.string().nullable().optional(),
  age_range: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  venueName: z.string().nullable().optional(),
  primaryImage: z.string().nullable().optional(),
  scheduleSummary: z.string().nullable().optional(),
  ageRangeLabel: z.string().nullable().optional(),
  priceLabel: z.string().nullable().optional(),
  featured: FeaturedInfoSchema,
  searchScore: z.number().nullable().optional(),
});

export const SearchResultsResponseSchema = z.object({
  results: z.array(ClassResultSchema),
  count: z.number().optional(),
  error: z.string().nullable().optional(),
});

// ============================================================================
// Class Details Schema
// ============================================================================

export const ClassDetailsSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  ageGroupMin: z.number(),
  ageGroupMax: z.number(),
  price: z.string().nullable().optional(),
  isFeatured: z.boolean().optional(),
  featuredPriority: z.number().optional(),
  featuredStatus: z.string().nullable().optional(),
  featuredStartsAt: z.string().nullable().optional(),
  featuredEndsAt: z.string().nullable().optional(),
  venue: z.string(),
  address: z.string(),
  postcode: z.string(),
  town: z.string(),
  additionalTowns: z.array(z.string()).nullable().optional(),
  latitude: z.union([z.string(), z.number()]).nullable().optional(),
  longitude: z.union([z.string(), z.number()]).nullable().optional(),
  searchRadiusKm: z.number().optional(),
  
  // Contact
  contactEmail: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  
  // Schedule
  dayOfWeek: z.string(),
  time: z.string().nullable().optional(),
  scheduleSummary: z.string().nullable().optional(),
  
  // Booking
  bookingEnabled: z.boolean().optional(),
  bookingType: z.string().nullable().optional(),
  bookingUrl: z.string().nullable().optional(),
  bookingEmail: z.string().nullable().optional(),
  bookingPhone: z.string().nullable().optional(),
  
  // Pricing
  bookingPrice: z.union([z.string(), z.number()]).nullable().optional(),
  pricePerSession: z.union([z.string(), z.number()]).nullable().optional(),
  priceDetails: z.string().nullable().optional(),
  
  // Images
  primaryImage: z.string().nullable().optional(),
  images: z.array(z.string()).nullable().optional(),
  
  // Metadata
  category: z.string().nullable().optional(),
  popularity: z.number().nullable().optional(),
  reviewCount: z.number().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
}).passthrough(); // Allow additional fields for flexibility

export const ClassDetailsResponseSchema = z.object({
  success: z.boolean().optional(),
  data: ClassDetailsSchema,
  error: z.string().nullable().optional(),
});

// ============================================================================
// Wallet Summary Schema
// ============================================================================

export const WalletTransactionSchema = z.object({
  id: z.string(),
  type: z.enum(["credit", "debit", "adjustment", "bonus"]),
  amount_cents: z.number(),
  description: z.string(),
  created_at: z.string(),
  metadata: z.record(z.unknown()).nullable().optional(),
});

export const WalletSummarySchema = z.object({
  balance_cents: z.number(),
  transactions: z.array(WalletTransactionSchema),
});

export const WalletResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.object({
    wallet: z.object({
      balance_cents: z.number().optional(),
      id: z.string().optional(),
      created_at: z.string().optional(),
      updated_at: z.string().optional(),
    }).optional(),
    transactions: z.array(WalletTransactionSchema).optional(),
  }).passthrough(),
  error: z.string().nullable().optional(),
});

// ============================================================================
// Provider Dashboard Metrics Schema
// ============================================================================

export const ProviderMetricSchema = z.object({
  id: z.number().optional(),
  providerId: z.number(),
  metricDate: z.string(), // ISO date string
  views: z.number(),
  websiteClicks: z.number().optional(),
  phoneClicks: z.number().optional(),
  emailClicks: z.number().optional(),
  createdAt: z.string().nullable().optional(),
});

export const ProviderDashboardMetricsSchema = z.object({
  success: z.boolean().optional(),
  data: z.object({
    totalViews: z.number().optional(),
    totalWebsiteClicks: z.number().optional(),
    totalPhoneClicks: z.number().optional(),
    totalEmailClicks: z.number().optional(),
    metrics: z.array(ProviderMetricSchema).optional(),
    period: z.object({
      start: z.string().optional(),
      end: z.string().optional(),
    }).optional(),
  }).passthrough(),
  error: z.string().nullable().optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type ClassResult = z.infer<typeof ClassResultSchema>;
export type ClassDetails = z.infer<typeof ClassDetailsSchema>;
export type WalletSummary = z.infer<typeof WalletSummarySchema>;
export type WalletTransaction = z.infer<typeof WalletTransactionSchema>;
export type ProviderDashboardMetrics = z.infer<typeof ProviderDashboardMetricsSchema>;
export type ProviderMetric = z.infer<typeof ProviderMetricSchema>;

