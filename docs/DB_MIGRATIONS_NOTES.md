# Database Migrations Notes

## Overview

This document explains the database migration strategy for Parent Helper, including how to apply migrations, which files are the baseline, and which tables are legacy.

## Migration Strategy

### Bootstrap Migration

**File**: `supabase/migrations/20240101000000_init_core_schema.sql`

This is the **baseline migration** that initializes all core tables for the modern booking flow. It should be run **first** before applying other migrations.

**Key Features:**
- Uses `CREATE TABLE IF NOT EXISTS` for safety
- Uses `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` to add missing columns to existing tables
- Guards against missing tables with `IF EXISTS` checks
- Safe to run on existing databases without data loss

**Core Tables Created:**
- `providers` - Provider/business listings
- `classes` - Class listings
- `simple_bookings` - Modern booking system (UUID primary key)
- `booking_payments` - Payment records linked to `simple_bookings`
- `session_instances` - Specific class occurrences
- `class_sessions` - Recurring class schedules
- `wallet_accounts` - User wallet accounts
- `wallet_transactions` - Wallet transaction history
- `family_wallets` - Family wallet groups
- `family_wallet_members` - Family wallet membership
- `rewards` - User rewards
- `referrals` - Referral tracking
- `member_referrals` - Parent-to-parent referrals
- `provider_referrals` - Provider referral program
- `children` - Child profiles (modern schema)
- `child_preferences` - Child preferences
- `calendar_feeds` - Calendar sync tokens
- `saved_searches` - Saved search alerts
- `provider_reviews` - Provider reviews
- `provider_reputation` - Provider reputation cache

### Applying Migrations

#### Option 1: Supabase SQL Editor (Recommended for Production)

1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `20240101000000_init_core_schema.sql`
4. Run the migration
5. Apply remaining migrations in chronological order (by filename)

#### Option 2: Supabase CLI

```bash
# Link to your project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push

# Or apply specific migration
supabase migration up
```

### Migration Order

Migrations are applied in alphabetical order by filename. The bootstrap migration (`00000000000000_init_core_schema.sql`) should be run first, then all other migrations in chronological order:

1. `20240101000000_init_core_schema.sql` (Bootstrap - run first)
2. `create_analytics_table.sql` (if exists)
3. `20250101_*.sql` (January 2025 migrations)
4. `20250115_*.sql`
5. `20250116_*.sql`
6. ... (continue chronologically)

## Modern Booking Flow

The modern booking system uses these core tables:

- **`simple_bookings`** - Primary booking table (UUID primary key)
  - Links to `session_instances` via `occurrence_id`
  - Uses Stripe Payment Links for checkout
  - Status: `pending`, `confirmed`, `cancelled`, `refunded`

- **`booking_payments`** - Payment records
  - References `simple_bookings.id` (UUID)
  - Tracks `amount_cents`, `fee_cents`, `net_cents`
  - Links to Stripe charges/payment intents

- **`session_instances`** - Specific class occurrences
  - Links to `class_sessions` (recurring schedule)
  - Has `stripe_payment_link_url` for booking
  - Tracks capacity and availability

## Legacy Tables

The following tables exist in production but are **not used** by the modern booking flow:

### Legacy Booking Tables

- **`bookings`** (integer ID) - Old booking system
  - Status: Legacy, replaced by `simple_bookings`
  - References: Some old migrations may still reference this
  - Action: Do not delete, but do not use for new bookings

- **`booking_requests`** - Old booking request system
  - Status: Legacy, replaced by direct `simple_bookings` creation
  - Action: Do not delete, but do not use for new bookings

- **`booking_occurrences`** - Old occurrence linking
  - Status: Legacy, `simple_bookings` directly references `session_instances`
  - Action: Do not delete, but do not use

### Legacy Wallet Tables

- **`user_wallets`** - Old wallet system (if exists)
  - Status: Legacy, replaced by `wallet_accounts`
  - Action: Do not delete, but do not use

### Legacy Family Profile Tables

- **`family_profiles`** - Old family profile system
  - Status: Legacy, modern schema uses `children` with direct `user_id` reference
  - Note: `children` table in modern schema does NOT reference `family_profiles`
  - Action: Do not delete, but do not use for new features

### Legacy Saved Searches

- Old saved search tables (if any exist)
  - Status: Replaced by `saved_searches` table
  - Action: Do not delete, but do not use

## Views and Materialized Views

Several views reference core tables and are guarded against missing tables:

- **`growth_metrics_view`** - Aggregates booking, wallet, referral metrics
  - Uses `simple_bookings` and `booking_payments`
  - Safe to create even if tables don't exist yet

- **`referral_analytics_view`** - Referral analytics
  - Uses `referrals` and `rewards` tables
  - Safe to create even if tables don't exist yet

## Migration Safety

All migrations have been updated to:

1. **Guard against missing tables** - Use `IF EXISTS` checks before referencing tables
2. **Use `IF NOT EXISTS`** - For creating tables, columns, indexes
3. **Preserve existing data** - Never drop tables or columns without explicit user action
4. **Reference modern tables** - Updated to use `simple_bookings` instead of legacy `bookings`

## Troubleshooting

### Migration Fails with "Table Already Exists"

This is expected if you're running the bootstrap migration on an existing database. The migration uses `IF NOT EXISTS` so it will skip creating tables that already exist.

### Migration Fails with "Column Already Exists"

The bootstrap migration uses `ADD COLUMN IF NOT EXISTS` to safely add missing columns. If you see this error, the column already exists and can be ignored.

### View Creation Fails

Views that reference tables are guarded with `IF EXISTS` checks. If a view creation fails, ensure the referenced tables exist by running the bootstrap migration first.

### Foreign Key Constraint Errors

If you see foreign key errors, ensure:
1. The bootstrap migration has been run
2. Referenced tables exist
3. Data types match (e.g., `simple_bookings.id` is UUID, not integer)

## Schema Source of Truth

**Drizzle Schema**: `shared/schema.ts`

The Drizzle schema file defines the **desired final state** of the database. It is used for TypeScript types only and does not apply schema changes. All actual schema changes must be made via migrations in `supabase/migrations/`.

## Next Steps

1. Run `20240101000000_init_core_schema.sql` in Supabase SQL Editor
2. Apply remaining migrations in chronological order
3. Verify tables exist: `simple_bookings`, `booking_payments`, `wallet_accounts`, etc.
4. Test booking flow to ensure it uses modern tables

## Questions?

If you encounter issues:
1. Check that the bootstrap migration ran successfully
2. Verify tables exist: `SELECT * FROM information_schema.tables WHERE table_schema = 'public'`
3. Check migration order matches chronological filename order
4. Review error messages for specific table/column issues

