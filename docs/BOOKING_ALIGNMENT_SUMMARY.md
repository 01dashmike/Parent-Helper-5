# Booking Tables Alignment - Implementation Summary

## Changes Implemented

### 1. Updated `awardBookingReward()` Function ✅
**File**: `lib/rewards/integrations.ts`

- Changed signature from `bookingId: number` to `bookingId: string | number`
- Now accepts both UUID (from `simple_bookings`) and integer (from legacy `bookings`)
- Maintains backward compatibility with legacy system
- Added documentation explaining the dual support

**Impact**: All new booking operations can now use UUID from `simple_bookings` while maintaining compatibility with legacy integer IDs.

### 2. Created Unified Booking Query Helpers ✅
**File**: `lib/bookings/unified.ts`

New helper functions:
- `getBookingById(bookingId: string | number)` - Unified query checking `simple_bookings` first, then `bookings`
- `getUserBookings(userEmail: string)` - Returns bookings from both tables, sorted by date
- `bookingExists(bookingId: string | number)` - Checks if booking exists in either table

**Purpose**: Provides read-only unified access to both booking systems without requiring code changes throughout the codebase.

### 3. Documentation Created ✅
**File**: `docs/BOOKING_TABLES_CONSOLIDATION.md`

Comprehensive analysis document including:
- Table schema comparison
- Reference mapping (all files using each table)
- Consolidation strategy
- Migration plan (phased approach)
- Foreign key dependencies
- Risk assessment
- Recommendations

## Current State

### ✅ Already Aligned with `simple_bookings`
- `booking_payments` table - References `simple_bookings.id` (UUID)
- `provider_reviews` table - References `simple_bookings.id` (UUID, nullable)
- `/api/stripe/webhook` - Creates `simple_bookings` records
- `/api/referral/convert` - Checks `simple_bookings` first
- `/api/reviews/*` - Uses `simple_bookings`
- `/api/providers/growth-score` - Counts `simple_bookings`
- User-facing booking pages - Display `simple_bookings`

### ⚠️ Still Using Legacy `bookings` Table (Read-Only)
- `/api/book/webhook` - Creates `bookings` (legacy flow, commented as legacy)
- `/api/admin/payments` - Reads both tables for reconciliation
- `/api/cron/provider-weekly-analytics` - Reads `bookings` for analytics
- `lib/gamification/growth-score.ts` - Reads `bookings` for growth score
- `app/account/_actions.ts` - Anonymizes `bookings` on user deletion

### 📋 Tables Referencing Legacy `bookings.id`
- `booking_attendees` - References `bookings.id` (integer)
- `booking_refunds` - References `bookings.id` (integer)
- `booking_occurrences` - References `bookings.id` (integer)

**Note**: These tables are legacy-only and no new records are expected.

## Next Steps (Future)

### Phase 2: Unified View (Recommended)
Create a database view `unified_bookings` that combines both tables for read-only operations:
```sql
CREATE VIEW unified_bookings AS
SELECT 
  id::text as id,
  'simple_booking' as source,
  email,
  amount_cents,
  currency,
  status,
  created_at
FROM simple_bookings
UNION ALL
SELECT 
  id::text as id,
  'booking' as source,
  parent_email as email,
  (total_paid * 100)::integer as amount_cents,
  'gbp' as currency,
  status,
  created_at
FROM bookings;
```

### Phase 3: Data Migration (Optional)
If legacy data needs to be migrated:
1. Map integer IDs to UUIDs
2. Migrate `bookings` records to `simple_bookings` format
3. Update foreign keys in `booking_attendees`, `booking_refunds`, `booking_occurrences`

### Phase 4: Deprecation (Future)
1. Mark `bookings` table as read-only
2. Remove write operations
3. Eventually archive or remove table

## Testing Recommendations

1. **Unit Tests**
   - Test `awardBookingReward()` with UUID
   - Test `awardBookingReward()` with integer (backward compatibility)
   - Test unified booking query helpers

2. **Integration Tests**
   - Verify `simple_bookings` creation flow
   - Verify reward awarding with UUID
   - Verify referral conversion with UUID

3. **E2E Tests**
   - Test booking flow uses `simple_bookings`
   - Test reward redemption uses `simple_bookings`

## Notes

- All **NEW** booking operations should use `simple_bookings` exclusively
- Legacy `bookings` table remains for historical data
- Both systems can coexist without breaking changes
- `awardBookingReward()` now supports both UUID and integer for backward compatibility
- Unified query helpers provide read-only access to both systems

