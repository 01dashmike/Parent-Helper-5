/**
 * Wallet System Schema
 *
 * Drizzle schema definitions for the wallet system
 */

import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
  jsonb,
  bigserial,
  boolean,
  bigint,
} from "drizzle-orm/pg-core";
import { users, providers } from "./schema";

// Parent Wallets
export const parentWallets = pgTable("parent_wallets", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  creditBalance: integer("credit_balance").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Wallet Ledger
export const walletLedger = pgTable("wallet_ledger", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // purchase | spend | refund | bonus | expiry | admin_adjustment | pass_purchase | pass_usage
  amount: integer("amount").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Parent Passes
export const parentPasses = pgTable("parent_passes", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  providerId: integer("provider_id")
    .notNull()
    .references(() => providers.id, { onDelete: "cascade" }),
  passType: text("pass_type").notNull(), // unlimited_weekly | unlimited_monthly | custom
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Provider Credit Settings
export const providerCreditSettings = pgTable("provider_credit_settings", {
  providerId: integer("provider_id")
    .primaryKey()
    .references(() => providers.id, { onDelete: "cascade" }),
  acceptsCredits: boolean("accepts_credits").default(false).notNull(),
  creditCostPerClass: integer("credit_cost_per_class").default(1).notNull(),
  unlimitedPassPrice: integer("unlimited_pass_price"),
  unlimitedPassType: text("unlimited_pass_type"), // weekly | monthly
  classOverrides: jsonb("class_overrides").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Booking Credit Redemptions
export const bookingCreditRedemptions = pgTable(
  "booking_credit_redemptions",
  {
    bookingId: bigint("booking_id", { mode: "number" }).primaryKey(), // References bookings.id
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    creditsSpent: integer("credits_spent").notNull(),
    passId: bigint("pass_id", { mode: "number" }).references(
      () => parentPasses.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);
