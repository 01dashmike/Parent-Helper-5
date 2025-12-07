# Booking Tables Consolidation Analysis & Migration Plan

## Executive Summary

The codebase currently uses two booking tables:
- **`simple_bookings`** (UUID primary key) - New system using Stripe Checkout
- **`bookings`** (integer primary key) - Legacy system using booking_requests

This document maps all references and proposes a consolidation strategy.

---

## Table Schema Comparison

### `simple_bookings` (Current/Preferred)
- **ID**: `uuid` (UUID)
- **Purpose**: Stripe Checkout-based bookings
- **Key Fields**: `occurrence_id`, `email`, `amount_cents`, `status`, `stripe_checkout_id`
- **Relationships**: 
  - References `session_instances.id`
  - Referenced by `booking_payments.booking_id` (UUID)
  - Referenced by `provider_reviews.booking_id` (UUID, nullable)

### `bookings` (Legacy)
- **ID**: `serial` (integer)
- **Purpose**: Booking request-based bookings
- **Key Fields**: `booking_request_id`, `class_id`, `provider_id`, `parent_name`, `parent_email`, `total_paid`, `confirmation_code`
- **Relationships**:
  - References `booking_requests.id`
  - Referenced by `booking_attendees.booking_id` (integer)
  - Referenced by `booking_refunds.booking_id` (integer)
  - Referenced by `booking_occurrences.booking_id` (integer)

### `booking_payments` (Revenue Tracking)
- **Current**: References `simple_bookings.id` (UUID) ✅
- **Status**: Already aligned with new system

### `provider_reviews` (Reviews)
- **Current**: References `simple_bookings.id` (UUID, nullable) ✅
- **Status**: Already aligned with new system

---

## Reference Mapping

### Files Using `simple_bookings.id` (UUID) ✅

1. **`app/api/stripe/webhook/route.ts`**
   - Creates `simple_bookings` records
   - Creates `booking_payments` with UUID reference
   - Creates `provider_reviews` with UUID reference

2. **`lib/booking-payments.ts`**
   - Function accepts UUID `bookingId`
   - Creates `booking_payments` records

3. **`app/api/referral/convert/route.ts`**
   - Checks `simple_bookings` first, falls back to `bookings`
   - Updates `simple_bookings.reward_triggered`

4. **`app/api/reviews/submit/route.ts`**
   - Queries `simple_bookings` for review validation

5. **`app/api/reviews/booking/[bookingId]/route.ts`**
   - Queries `simple_bookings` by UUID

6. **`app/booking/thanks/page.tsx`**
   - Displays booking confirmation from `simple_bookings`

7. **`app/(authed)/home/page.tsx`**
   - Lists user bookings from `simple_bookings`

8. **`lib/personalisation/recommendations.ts`**
   - Uses `simple_bookings` for recommendation engine

9. **`lib/marketing/automation.ts`**
   - Triggers automation on `simple_bookings` insert

10. **`app/api/providers/growth-score/route.ts`**
    - Counts bookings from `simple_bookings`

11. **`app/admin/payments/actions.ts`** & **`app/api/admin/payments/route.ts`**
    - Combines data from both tables for reconciliation

### Files Using `bookings.id` (Integer) ⚠️

1. **`app/api/book/webhook/route.ts`**
   - Creates `bookings` records (legacy flow)
   - Creates `booking_occurrences` with integer reference
   - **Note**: Comment indicates this is legacy, payment tracking handled elsewhere

2. **`lib/rewards/integrations.ts`**
   - `awardBookingReward()` accepts `bookingId: number` (integer)
   - **Issue**: Only works with legacy `bookings` table

3. **`app/account/_actions.ts`**
   - Anonymizes `bookings` on user deletion

4. **`app/admin/payments/actions.ts`** & **`app/api/admin/payments/route.ts`**
   - Queries both tables for reconciliation (read-only)

5. **`app/api/cron/provider-weekly-analytics/route.ts`**
   - Queries `bookings` for analytics

6. **`lib/gamification/growth-score.ts`**
   - Queries `bookings` for growth score calculation

7. **`tests/e2e/migrations/migration-flow.spec.ts`**
   - Tests legacy `bookings` table

### Tables Referencing `bookings.id` (Integer)

1. **`booking_attendees`**
   - `booking_id: integer` → `bookings.id`
   - **Status**: Legacy only, no new records expected

2. **`booking_refunds`**
   - `booking_id: integer` → `bookings.id`
   - **Status**: Legacy only, no new records expected

3. **`booking_occurrences`**
   - `booking_id: integer` → `bookings.id`
   - **Status**: Legacy only, `simple_bookings` has direct `occurrence_id` reference

---

## Consolidation Strategy

### Recommended Approach: **Keep `simple_bookings` Only**

**Rationale:**
1. `simple_bookings` is the active system (Stripe Checkout)
2. All new operations should use `simple_bookings`
3. `booking_payments` and `provider_reviews` already reference `simple_bookings`
4. Legacy `bookings` table can remain for historical data

### Migration Plan

#### Phase 1: Align New Operations (Current Task) ✅
- Update `awardBookingReward()` to accept UUID
- Ensure all new booking operations use `simple_bookings`
- Add helper functions for unified booking queries

#### Phase 2: Create Unified View (Future)
- Create database view `unified_bookings` combining both tables
- Use view for read-only analytics/reporting
- Maintain backward compatibility

#### Phase 3: Data Migration (Future - Optional)
- Migrate legacy `bookings` data to `simple_bookings` format
- Map integer IDs to UUIDs
- Update foreign keys in `booking_attendees`, `booking_refunds`, `booking_occurrences`

#### Phase 4: Deprecation (Future)
- Mark `bookings` table as read-only
- Remove write operations
- Eventually archive or remove table

---

## Required Code Changes

### Immediate (Minimal Alignment)

1. **Update `lib/rewards/integrations.ts`**
   - Change `awardBookingReward()` to accept `string` (UUID) instead of `number`
   - Update to query `simple_bookings` instead of `bookings`

2. **Update `app/api/stripe/webhook/route.ts`**
   - Call `awardBookingReward()` with UUID from `simple_bookings`

3. **Add Helper Functions**
   - `getBookingById()` - Unified query (checks `simple_bookings` first, falls back to `bookings`)
   - `getUserBookings()` - Unified query for user bookings

4. **Update Analytics Queries**
   - Ensure new analytics use `simple_bookings`
   - Keep legacy queries for historical data

### Future (Full Consolidation)

1. Create database view `unified_bookings`
2. Update all read queries to use view
3. Migrate legacy data (optional)
4. Deprecate `bookings` table

---

## Foreign Key Dependencies

### Current State

**`simple_bookings`** references:
- ✅ `session_instances.id` (via `occurrence_id`)

**`bookings`** references:
- ⚠️ `booking_requests.id` (via `booking_request_id`)
- ⚠️ `providers.id` (via `provider_id`)
- ⚠️ `classes.id` (via `class_id`)

**`booking_payments`** references:
- ✅ `simple_bookings.id` (UUID) - **Aligned**

**`provider_reviews`** references:
- ✅ `simple_bookings.id` (UUID, nullable) - **Aligned**

**`booking_attendees`** references:
- ⚠️ `bookings.id` (integer) - **Legacy only**

**`booking_refunds`** references:
- ⚠️ `bookings.id` (integer) - **Legacy only**

**`booking_occurrences`** references:
- ⚠️ `bookings.id` (integer) - **Legacy only**

---

## API Endpoints Impact

### Endpoints Using `simple_bookings` ✅
- `/api/stripe/webhook` - Creates `simple_bookings`
- `/api/referral/convert` - Queries `simple_bookings`
- `/api/reviews/submit` - Validates against `simple_bookings`
- `/api/reviews/booking/[bookingId]` - Queries `simple_bookings`
- `/api/providers/growth-score` - Counts `simple_bookings`

### Endpoints Using `bookings` ⚠️
- `/api/book/webhook` - Creates `bookings` (legacy flow)
- `/api/admin/payments` - Reads both tables (reconciliation)
- `/api/cron/provider-weekly-analytics` - Reads `bookings`

---

## Testing Considerations

1. **Unit Tests**
   - Update `awardBookingReward()` tests to use UUID
   - Test unified booking queries

2. **Integration Tests**
   - Verify `simple_bookings` creation flow
   - Verify reward awarding with UUID
   - Verify referral conversion with UUID

3. **E2E Tests**
   - Test booking flow uses `simple_bookings`
   - Test reward redemption uses `simple_bookings`

---

## Risk Assessment

### Low Risk ✅
- Updating `awardBookingReward()` to accept UUID
- Adding helper functions for unified queries
- Ensuring new operations use `simple_bookings`

### Medium Risk ⚠️
- Creating unified view (requires database migration)
- Updating analytics queries (may affect reporting)

### High Risk 🔴
- Migrating legacy data (data integrity concerns)
- Removing `bookings` table (breaking changes)

---

## Recommendations

1. **Immediate**: Implement minimal alignment (Phase 1)
2. **Short-term**: Create unified view for read operations
3. **Long-term**: Consider data migration if legacy data is needed
4. **Future**: Deprecate `bookings` table once all operations use `simple_bookings`

---

## Notes

- `booking_payments` and `provider_reviews` are already aligned with `simple_bookings`
- Legacy `bookings` table can remain for historical data
- No breaking changes required - both tables can coexist
- New operations should exclusively use `simple_bookings`

