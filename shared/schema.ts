/**
 * Shared Drizzle Schema Definitions
 * 
 * This file exports all database tables, types, and Zod schemas
 * used across the Parent Helper application.
 */

import { 
  pgTable, 
  text, 
  serial, 
  integer, 
  boolean, 
  decimal, 
  timestamp, 
  date, 
  uuid, 
  jsonb, 
  uniqueIndex, 
  index,
  bigserial,
  bigint
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

// ============================================================================
// Core Tables
// ============================================================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  // Add other user fields as needed
});

export const providers = pgTable("providers", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  // Add other provider fields as needed
}, (table) => ({
  slugIdx: uniqueIndex("providers_slug_idx").on(table.slug),
}));

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  providerId: integer("provider_id").notNull(),
  parentName: text("parent_name").notNull(),
  parentEmail: text("parent_email").notNull(),
  childName: text("child_name").notNull(),
  sessionDate: timestamp("session_date").notNull(),
  sessionsBooked: integer("sessions_booked").default(1),
  totalPaid: decimal("total_paid", { precision: 10, scale: 2 }).notNull(),
  confirmationCode: text("confirmation_code").notNull(),
  status: text("status").default("confirmed").notNull(),
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// Family & Children Tables
// ============================================================================

export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dateOfBirth: date("date_of_birth"),
  interests: jsonb("interests").default([]),
  allergies: jsonb("allergies").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const childPreferences = pgTable("child_preferences", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  preferredCategories: text("preferred_categories").array().default([]),
  preferredAgeMin: integer("preferred_age_min"),
  preferredAgeMax: integer("preferred_age_max"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const familyPlannerEvents = pgTable("family_planner_events", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: timestamp("event_date").notNull(),
  eventTime: text("event_time"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// Family Wallet Tables (separate from parent wallet system)
// ============================================================================

export const familyWallets = pgTable("family_wallets", {
  id: serial("id").primaryKey(),
  ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  balanceCents: integer("balance_cents").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull().references(() => familyWallets.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  invitedEmail: text("invited_email"),
  inviteToken: text("invite_token"),
  status: text("status").default("active").notNull(), // active | invited | inactive
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull().references(() => familyWallets.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  type: text("type").notNull(), // credit | debit | transfer
  description: text("description"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// Rewards & Referrals Tables
// ============================================================================

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  valueCents: integer("value_cents").notNull(),
  points: integer("points").notNull(),
  status: text("status").default("available").notNull(), // available | redeemed | expired
  source: text("source").notNull(), // referral | promotion | admin
  metadata: jsonb("metadata").default({}),
  redeemedAt: timestamp("redeemed_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerUserId: uuid("referrer_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referredUserId: uuid("referred_user_id").references(() => users.id, { onDelete: "set null" }),
  referralCode: text("referral_code").notNull(),
  status: text("status").default("pending").notNull(), // pending | converted | expired
  convertedAt: timestamp("converted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// Classes Table
// ============================================================================

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  providerId: integer("provider_id").references(() => providers.id, { onDelete: "cascade" }),
  category: text("category"),
  town: text("town"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Add other class fields as needed
});

// ============================================================================
// User Preferences Table
// ============================================================================

export const userClassPreferences = pgTable("user_class_preferences", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  preferredCategories: text("preferred_categories").array().default([]).notNull(),
  preferredAgeMin: integer("preferred_age_min"),
  preferredAgeMax: integer("preferred_age_max"),
  recentClassIds: integer("recent_class_ids").array().default([]).notNull(),
  lastCity: text("last_city"),
  lastSearchQuery: text("last_search_query"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdUnique: uniqueIndex("user_class_preferences_user_id_unique").on(table.userId),
  userIdIdx: index("user_class_preferences_user_id_idx").on(table.userId),
}));

// ============================================================================
// Booking Payments Table
// ============================================================================

export const bookingPayments = pgTable("booking_payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending").notNull(),
  paymentIntentId: text("payment_intent_id"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Add other payment fields as needed
});

// ============================================================================
// Provider Badges Table
// ============================================================================

export const providerBadges = pgTable("provider_badges", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").references(() => providers.id, { onDelete: "cascade" }),
  badgeType: text("badge_type").notNull(),
  badgeName: text("badge_name").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Add other badge fields as needed
});

// ============================================================================
// Provider XP Events Table
// ============================================================================

export const providerXpEvents = pgTable("provider_xp_events", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").references(() => providers.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  xpAmount: integer("xp_amount").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Add other XP event fields as needed
});

// ============================================================================
// Zod Schemas
// ============================================================================

export const insertChildSchema = createInsertSchema(children);
export const insertChildPreferenceSchema = createInsertSchema(childPreferences);
export const insertFamilyPlannerEventSchema = createInsertSchema(familyPlannerEvents);

export const rewardMetadataSchema = z.object({
  source: z.string(),
  referral_code: z.string().optional(),
  referred_user_id: z.string().uuid().optional(),
  booking_id: z.union([z.number(), z.string()]).optional(), // Supports both UUID and integer for backward compat
  referral_id: z.number().optional(),
  referred_email: z.string().email().optional(),
  referrer_user_id: z.string().uuid().optional(),
  milestone: z.string().optional(), // For milestone-based rewards
  child_id: z.string().optional(), // For child-related rewards
  search_id: z.string().optional(), // For search-related rewards
});

export const insertRewardSchema = createInsertSchema(rewards);

export const insertBookingPaymentSchema = createInsertSchema(bookingPayments);

export const listClassSchema = createSelectSchema(classes);

// ============================================================================
// Type Exports
// ============================================================================

export type Child = InferSelectModel<typeof children>;
export type InsertChild = InferInsertModel<typeof children>;

export type Reward = InferSelectModel<typeof rewards>;
export type InsertReward = InferInsertModel<typeof rewards>;
export type RewardMetadata = z.infer<typeof rewardMetadataSchema>;

export type Referral = InferSelectModel<typeof referrals>;
export type InsertReferral = InferInsertModel<typeof referrals>;

export type InsertFamilyPlannerEvent = InferInsertModel<typeof familyPlannerEvents>;

export type InsertBookingPayment = InferInsertModel<typeof bookingPayments>;

export type InsertProviderBadge = InferInsertModel<typeof providerBadges>;

export type InsertProviderXpEvent = InferInsertModel<typeof providerXpEvents>;

export type ListClassData = InferSelectModel<typeof classes>;

// Dummy exports for compatibility
export type SearchResult = Record<string, unknown>;
export const searchSchema = {} as Record<string, unknown>;
export type ClassListData = Record<string, unknown>;
export const classListSchema = {} as Record<string, unknown>;
