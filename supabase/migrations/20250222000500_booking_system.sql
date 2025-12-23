-- Booking & Checkout System Migration
-- Creates tables for class sessions, bookings, upsells, and provider settings

-- Class Sessions (calendar instances)
create table if not exists class_sessions (
  id bigserial primary key,
  class_id integer not null references classes(id) on delete cascade,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  capacity integer not null default 10,
  seats_taken integer default 0 not null,
  is_cancelled boolean default false not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create index if not exists class_sessions_class_id_start_time_idx on class_sessions(class_id, start_time);
create index if not exists class_sessions_start_time_idx on class_sessions(start_time);
create index if not exists class_sessions_is_cancelled_idx on class_sessions(is_cancelled);

-- Bookings (parent bookings per session/block)
create table if not exists bookings (
  id bigserial primary key,
  session_id bigint references class_sessions(id) on delete set null,
  provider_id integer not null references providers(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  parent_first_name text not null,
  parent_last_name text not null,
  parent_email text not null,
  parent_phone text,
  children jsonb not null default '[]'::jsonb, -- [{name, age, notes, allergies}]
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'refunded', 'attended')),
  booking_type text not null default 'drop_in' check (booking_type in ('drop_in', 'block', 'free_rsvp')),
  price_total decimal(10, 2) default 0 not null,
  upsell_items jsonb default '[]'::jsonb, -- [{upsell_id, title, price}]
  linked_session_ids bigint[] default '{}'::bigint[], -- For block bookings
  custom_fields jsonb default '{}'::jsonb, -- Provider-specific questions
  notes text,
  confirmation_email_sent boolean default false not null,
  reminder_email_sent boolean default false not null,
  review_email_sent boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create index if not exists bookings_session_id_idx on bookings(session_id);
create index if not exists bookings_provider_id_idx on bookings(provider_id);
create index if not exists bookings_user_id_idx on bookings(user_id);
create index if not exists bookings_status_idx on bookings(status);
create index if not exists bookings_created_at_idx on bookings(created_at);
create index if not exists bookings_parent_email_idx on bookings(parent_email);

-- Upsells (provider-controlled upsell items)
create table if not exists upsells (
  id bigserial primary key,
  provider_id integer not null references providers(id) on delete cascade,
  class_id integer references classes(id) on delete cascade, -- null = provider-wide
  title text not null,
  description text,
  price decimal(10, 2) not null,
  type text not null check (type in ('block_upgrade', 'add_on', 'subscription_offer')),
  is_enabled boolean default true not null,
  display_order integer default 0 not null,
  metadata jsonb default '{}'::jsonb, -- e.g., {block_weeks: 4, discount_percent: 20}
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create index if not exists upsells_provider_id_idx on upsells(provider_id);
create index if not exists upsells_class_id_idx on upsells(class_id);
create index if not exists upsells_is_enabled_idx on upsells(is_enabled);
create index if not exists upsells_type_idx on upsells(type);

-- Upsell Analytics (track impressions and conversions)
create table if not exists upsell_analytics (
  id bigserial primary key,
  upsell_id bigint not null references upsells(id) on delete cascade,
  booking_id bigint references bookings(id) on delete set null,
  event_type text not null check (event_type in ('viewed', 'accepted', 'dismissed')),
  session_id bigint references class_sessions(id) on delete set null,
  created_at timestamp with time zone default now() not null
);

create index if not exists upsell_analytics_upsell_id_idx on upsell_analytics(upsell_id);
create index if not exists upsell_analytics_booking_id_idx on upsell_analytics(booking_id);
create index if not exists upsell_analytics_event_type_idx on upsell_analytics(event_type);
create index if not exists upsell_analytics_created_at_idx on upsell_analytics(created_at);

-- Provider Booking Settings
create table if not exists provider_booking_settings (
  id bigserial primary key,
  provider_id integer not null references providers(id) on delete cascade,
  class_id integer references classes(id) on delete cascade, -- null = provider-wide defaults
  allow_free_bookings boolean default true not null,
  allow_drop_ins boolean default true not null,
  allow_block_bookings boolean default false not null,
  default_capacity integer default 10 not null,
  require_child_details boolean default true not null,
  require_parent_phone boolean default false not null,
  custom_questions jsonb default '[]'::jsonb, -- [{question, required, type}]
  booking_deadline_hours integer default 2 not null, -- Hours before session start
  cancellation_policy text,
  refund_policy text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(provider_id, class_id)
);

create index if not exists provider_booking_settings_provider_id_idx on provider_booking_settings(provider_id);
create index if not exists provider_booking_settings_class_id_idx on provider_booking_settings(class_id);

-- Payment Placeholders (for future integration)
create table if not exists booking_payments (
  id bigserial primary key,
  booking_id bigint not null references bookings(id) on delete cascade,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  amount_cents integer not null,
  currency text default 'gbp' not null,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  provider_payout_id text, -- For provider payouts
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create index if not exists booking_payments_booking_id_idx on booking_payments(booking_id);
create index if not exists booking_payments_stripe_payment_intent_id_idx on booking_payments(stripe_payment_intent_id);
create index if not exists booking_payments_status_idx on booking_payments(status);

-- Provider Stripe Accounts (placeholder for future)
create table if not exists provider_stripe_accounts (
  id bigserial primary key,
  provider_id integer not null references providers(id) on delete cascade,
  stripe_account_id text unique,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(provider_id)
);

create index if not exists provider_stripe_accounts_provider_id_idx on provider_stripe_accounts(provider_id);

-- Update triggers
create trigger class_sessions_updated_at before update on class_sessions
  for each row execute function update_updated_at_column();

create trigger bookings_updated_at before update on bookings
  for each row execute function update_updated_at_column();

create trigger upsells_updated_at before update on upsells
  for each row execute function update_updated_at_column();

create trigger provider_booking_settings_updated_at before update on provider_booking_settings
  for each row execute function update_updated_at_column();

create trigger booking_payments_updated_at before update on booking_payments
  for each row execute function update_updated_at_column();

create trigger provider_stripe_accounts_updated_at before update on provider_stripe_accounts
  for each row execute function update_updated_at_column();








