# Booking System - Data Model

## 📊 Database Tables

### `class_sessions`

Calendar instances of classes.

```sql
id                  bigserial PRIMARY KEY
class_id            integer REFERENCES classes(id)
start_time          timestamptz NOT NULL
end_time            timestamptz NOT NULL
capacity            integer DEFAULT 10
seats_taken         integer DEFAULT 0
is_cancelled        boolean DEFAULT false
metadata            jsonb DEFAULT '{}'
created_at          timestamptz
updated_at          timestamptz
```

**Indexes:**
- `(class_id, start_time)` - Fast session lookup
- `start_time` - Date range queries
- `is_cancelled` - Filter cancelled sessions

---

### `bookings`

Parent bookings per session/block.

```sql
id                      bigserial PRIMARY KEY
session_id              bigint REFERENCES class_sessions(id)
provider_id             integer REFERENCES providers(id)
user_id                 uuid REFERENCES users(id) [nullable]
parent_first_name       text NOT NULL
parent_last_name        text NOT NULL
parent_email            text NOT NULL
parent_phone             text [nullable]
children                jsonb NOT NULL DEFAULT '[]'
status                  text DEFAULT 'pending'
booking_type            text DEFAULT 'drop_in'
price_total             decimal(10,2) DEFAULT 0
upsell_items            jsonb DEFAULT '[]'
linked_session_ids      bigint[] DEFAULT '{}'
custom_fields           jsonb DEFAULT '{}'
notes                   text [nullable]
confirmation_email_sent boolean DEFAULT false
reminder_email_sent     boolean DEFAULT false
review_email_sent       boolean DEFAULT false
created_at              timestamptz
updated_at              timestamptz
```

**Status values:**
- `pending` - Awaiting confirmation
- `confirmed` - Booking confirmed
- `cancelled` - Cancelled by user/provider
- `refunded` - Payment refunded
- `attended` - Marked as attended

**Booking types:**
- `drop_in` - Single session
- `block` - Multiple sessions
- `free_rsvp` - Free reservation

**Children JSON structure:**
```json
[
  {
    "name": "Emma",
    "age": 2,
    "notes": "Loves music",
    "allergies": "None"
  }
]
```

**Upsell items JSON structure:**
```json
[
  {
    "upsellId": 1,
    "title": "Sensory Kit",
    "price": 15.00
  }
]
```

**Indexes:**
- `session_id` - Find bookings for session
- `provider_id` - Provider bookings
- `user_id` - User bookings
- `status` - Filter by status
- `created_at` - Recent bookings
- `parent_email` - Email lookup

---

### `upsells`

Provider-controlled upsell items.

```sql
id              bigserial PRIMARY KEY
provider_id     integer REFERENCES providers(id)
class_id        integer REFERENCES classes(id) [nullable]
title           text NOT NULL
description     text [nullable]
price           decimal(10,2) NOT NULL
type            text NOT NULL
is_enabled      boolean DEFAULT true
display_order   integer DEFAULT 0
metadata        jsonb DEFAULT '{}'
created_at      timestamptz
updated_at      timestamptz
```

**Types:**
- `block_upgrade` - Multi-week discount
- `add_on` - One-time item
- `subscription_offer` - Subscription trial

**Metadata examples:**
```json
{
  "block_weeks": 4,
  "discount_percent": 20
}
```

**Indexes:**
- `provider_id` - Provider upsells
- `class_id` - Class-specific upsells
- `is_enabled` - Active upsells
- `type` - Filter by type

---

### `upsell_analytics`

Track upsell performance.

```sql
id          bigserial PRIMARY KEY
upsell_id   bigint REFERENCES upsells(id)
booking_id  bigint REFERENCES bookings(id) [nullable]
event_type  text NOT NULL
session_id  bigint REFERENCES class_sessions(id) [nullable]
created_at  timestamptz
```

**Event types:**
- `viewed` - Upsell displayed
- `accepted` - Added to booking
- `dismissed` - User skipped

**Indexes:**
- `upsell_id` - Upsell performance
- `booking_id` - Booking upsells
- `event_type` - Filter events
- `created_at` - Time series

---

### `provider_booking_settings`

Provider booking configuration.

```sql
id                      bigserial PRIMARY KEY
provider_id             integer REFERENCES providers(id)
class_id                integer REFERENCES classes(id) [nullable]
allow_free_bookings     boolean DEFAULT true
allow_drop_ins          boolean DEFAULT true
allow_block_bookings    boolean DEFAULT false
default_capacity        integer DEFAULT 10
require_child_details   boolean DEFAULT true
require_parent_phone    boolean DEFAULT false
custom_questions        jsonb DEFAULT '[]'
booking_deadline_hours  integer DEFAULT 2
cancellation_policy     text [nullable]
refund_policy           text [nullable]
created_at              timestamptz
updated_at              timestamptz
```

**Custom questions JSON:**
```json
[
  {
    "question": "Does your child have any allergies?",
    "required": false,
    "type": "text"
  }
]
```

**Unique constraint:** `(provider_id, class_id)` - One setting per provider/class

---

### `booking_payments` (Placeholder)

Payment records for future integration.

```sql
id                      bigserial PRIMARY KEY
booking_id             bigint REFERENCES bookings(id)
stripe_payment_intent_id text [nullable]
stripe_customer_id     text [nullable]
amount_cents           integer NOT NULL
currency               text DEFAULT 'gbp'
status                 text DEFAULT 'pending'
provider_payout_id     text [nullable]
created_at             timestamptz
updated_at             timestamptz
```

---

### `provider_stripe_accounts` (Placeholder)

Stripe Connect accounts for providers.

```sql
id                  bigserial PRIMARY KEY
provider_id         integer REFERENCES providers(id)
stripe_account_id   text UNIQUE
is_active           boolean DEFAULT true
created_at          timestamptz
updated_at          timestamptz
```

---

## 🔄 Data Flow

### Booking Creation Flow

1. **User selects session** → `checkSessionAvailability()`
2. **User fills form** → Validate child ages
3. **User selects upsells** → Track views
4. **User confirms** → `createBooking()`
   - Reserve seats (atomic)
   - Create booking record
   - Track analytics
   - Send confirmation email
5. **Booking confirmed** → Update class popularity

### Block Booking Flow

1. **User selects block option** → `createBlockBooking()`
2. **System finds future sessions** → Check availability for all
3. **Reserve all seats** → Atomic operations
4. **Create booking with linked sessions** → Single booking record
5. **Send confirmation** → Include all session dates

### Cancellation Flow

1. **User/provider cancels** → `cancelBooking()`
2. **Release seats** → `releaseSessionSeats()`
3. **Update status** → `cancelled`
4. **Process refund** → (If payment integrated)

---

## 📈 Analytics Events

### Booking Events

```typescript
{
  event: "booking_started",
  data: {
    class_id: number,
    provider_id: number,
    booking_type: "drop_in" | "block" | "free_rsvp"
  }
}

{
  event: "booking_completed",
  data: {
    booking_id: number,
    class_id: number,
    provider_id: number,
    booking_type: string,
    price_total: number,
    children_count: number
  }
}

{
  event: "block_booking_selected",
  data: {
    booking_id: number,
    class_id: number,
    week_count: number
  }
}
```

### Upsell Events

```typescript
{
  event: "upsell_viewed",
  data: {
    upsell_id: number,
    session_id?: number
  }
}

{
  event: "upsell_accepted",
  data: {
    upsell_id: number,
    booking_id: number
  }
}
```

### Capacity Events

```typescript
{
  event: "class_capacity_exceeded",
  data: {
    session_id: number,
    requested_seats: number,
    available_seats: number
  }
}
```

---

## 🔐 Security Considerations

### Capacity Management

- **Atomic operations** - `reserveSessionSeats()` uses database-level locking
- **Double-check** - Verify availability before and during reservation
- **Race condition prevention** - Database constraints prevent overbooking

### Age Validation

- **Server-side check** - Child age validated against class age range
- **Rejection message** - Clear error if age mismatch

### Provider Protection

- **Provider check** - Providers cannot book their own classes
- **Server-side validation** - All checks happen server-side

---

## 📊 Queries

### Get Available Sessions

```sql
SELECT *
FROM class_sessions
WHERE class_id = $1
  AND start_time >= NOW()
  AND is_cancelled = false
  AND seats_taken < capacity
ORDER BY start_time ASC;
```

### Get Bookings for Session

```sql
SELECT *
FROM bookings
WHERE session_id = $1
  AND status IN ('confirmed', 'pending')
ORDER BY created_at DESC;
```

### Get Upsell Performance

```sql
SELECT
  u.id,
  u.title,
  COUNT(DISTINCT CASE WHEN ua.event_type = 'viewed' THEN ua.id END) as views,
  COUNT(DISTINCT CASE WHEN ua.event_type = 'accepted' THEN ua.id END) as acceptances,
  SUM(CASE WHEN ua.event_type = 'accepted' THEN u.price ELSE 0 END) as revenue
FROM upsells u
LEFT JOIN upsell_analytics ua ON u.id = ua.upsell_id
WHERE u.provider_id = $1
  AND ua.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.title, u.price;
```

---

## 🔄 Migration Notes

The migration file `20250222000500_booking_system.sql` creates all tables with:
- Proper foreign keys
- Indexes for performance
- Check constraints for data integrity
- Update triggers for `updated_at`

Run migration:
```bash
supabase migration up
# or
psql $DATABASE_URL -f supabase/migrations/20250222000500_booking_system.sql
```








