-- Premium features migration (plans, featured listings, bookings v4b)

-- Subscription plans
create table if not exists public.plans (
  id serial primary key,
  slug text not null unique,
  name text not null,
  description text,
  monthly_price_cents integer not null default 0,
  currency text not null default 'gbp',
  stripe_product_id text,
  stripe_price_id text,
  featured_boost integer not null default 0,
  daily_featured_cap integer not null default 0,
  monthly_featured_budget_cents integer not null default 0,
  includes_featured boolean not null default false,
  includes_bookings boolean not null default false,
  includes_analytics boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Provider subscriptions
create table if not exists public.provider_subscriptions (
  id serial primary key,
  provider_id integer not null references public.providers(id) on delete cascade,
  plan_id integer not null references public.plans(id) on delete restrict,
  status text not null default 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  latest_invoice_id text,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists provider_subscriptions_stripe_idx
  on public.provider_subscriptions(stripe_subscription_id)
  where stripe_subscription_id is not null;

create unique index if not exists provider_active_subscription_idx
  on public.provider_subscriptions(provider_id)
  where status in ('active', 'trialing');

-- Subscription usage tracking (featured budgets, bookings, etc.)
create table if not exists public.provider_subscription_usage (
  id serial primary key,
  provider_subscription_id integer not null references public.provider_subscriptions(id) on delete cascade,
  usage_date date not null,
  featured_impressions integer not null default 0,
  featured_spend_cents integer not null default 0,
  featured_clicks integer not null default 0,
  bookings_count integer not null default 0,
  booking_revenue_cents integer not null default 0,
  created_at timestamptz not null default now(),
  unique(provider_subscription_id, usage_date)
);

-- Featured listings for boosted search placement
create table if not exists public.featured_listings (
  id serial primary key,
  class_id integer not null references public.classes(id) on delete cascade,
  provider_id integer not null references public.providers(id) on delete cascade,
  provider_subscription_id integer references public.provider_subscriptions(id) on delete set null,
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  daily_cap integer not null default 0,
  daily_spend_cents integer not null default 0,
  monthly_budget_cents integer not null default 0,
  last_reset_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(class_id)
);

create index if not exists featured_listings_provider_idx
  on public.featured_listings(provider_id);

-- Booking phase 4b: class sessions & attendees
create table if not exists public.class_sessions (
  id serial primary key,
  class_id integer not null references public.classes(id) on delete cascade,
  title text,
  description text,
  weekday integer,
  start_time time,
  end_time time,
  duration_minutes integer,
  capacity integer,
  price_cents integer,
  currency text not null default 'gbp',
  is_recurring boolean not null default true,
  recurrence_rule text,
  booking_cutoff_hours integer default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.session_instances (
  id serial primary key,
  session_id integer not null references public.class_sessions(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer,
  available_spots integer,
  status text not null default 'scheduled',
  is_bookable boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, starts_at)
);

create index if not exists session_instances_status_idx
  on public.session_instances(status, starts_at);

alter table public.booking_requests
  add column if not exists session_instance_id integer references public.session_instances(id) on delete set null,
  add column if not exists currency text default 'gbp',
  add column if not exists pricing_snapshot jsonb,
  add column if not exists acknowledgement_sent_at timestamptz,
  add column if not exists metadata jsonb;

alter table public.bookings
  add column if not exists session_instance_id integer references public.session_instances(id) on delete set null,
  add column if not exists payment_status text default 'paid',
  add column if not exists refund_status text default 'none',
  add column if not exists total_refunded_cents integer not null default 0,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_charge_id text,
  add column if not exists stripe_refund_id text,
  add column if not exists confirmation_sent_at timestamptz,
  add column if not exists cancellation_reason text,
  add column if not exists metadata jsonb;

create table if not exists public.booking_attendees (
  id serial primary key,
  booking_id integer not null references public.bookings(id) on delete cascade,
  attendee_name text not null,
  attendee_age_years integer,
  attendee_notes text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.booking_refunds (
  id serial primary key,
  booking_id integer not null references public.bookings(id) on delete cascade,
  amount_cents integer not null,
  reason text,
  status text not null default 'pending',
  stripe_refund_id text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.providers
  add column if not exists current_plan_id integer references public.plans(id) on delete set null,
  add column if not exists billing_status text default 'trialing',
  add column if not exists stripe_customer_id text,
  add column if not exists billing_email text,
  add column if not exists feature_allocation jsonb;

alter table public.classes
  add column if not exists featured_priority integer not null default 0,
  add column if not exists featured_status text not null default 'standard',
  add column if not exists featured_starts_at timestamptz,
  add column if not exists featured_ends_at timestamptz,
  add column if not exists featured_daily_cap integer,
  add column if not exists featured_budget_cents integer;

-- Basic RLS enabling for new tables (service role only for now)
alter table public.plans enable row level security;
alter table public.provider_subscriptions enable row level security;
alter table public.provider_subscription_usage enable row level security;
alter table public.featured_listings enable row level security;
alter table public.class_sessions enable row level security;
alter table public.session_instances enable row level security;
alter table public.booking_attendees enable row level security;
alter table public.booking_refunds enable row level security;

create policy if not exists "service role access - plans" on public.plans
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "service role access - provider subscriptions" on public.provider_subscriptions
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "service role access - provider subscription usage" on public.provider_subscription_usage
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "service role access - featured listings" on public.featured_listings
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "service role access - class sessions" on public.class_sessions
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "service role access - session instances" on public.session_instances
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "service role access - booking attendees" on public.booking_attendees
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "service role access - booking refunds" on public.booking_refunds
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Seed default plans
insert into public.plans (slug, name, description, monthly_price_cents, currency, featured_boost, daily_featured_cap, monthly_featured_budget_cents, includes_featured, includes_bookings, includes_analytics)
values
  ('free', 'Free', 'Essential listing with standard placement.', 0, 'gbp', 0, 0, 0, false, false, false),
  ('promote', 'Promote', 'Boosted visibility with featured placement and insights.', 1000, 'gbp', 50, 100, 30000, true, false, true),
  ('bookings', 'Bookings', 'Full bookings suite with payments, featured boosts, and analytics.', 2500, 'gbp', 75, 150, 60000, true, true, true)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  monthly_price_cents = excluded.monthly_price_cents,
  currency = excluded.currency,
  featured_boost = excluded.featured_boost,
  daily_featured_cap = excluded.daily_featured_cap,
  monthly_featured_budget_cents = excluded.monthly_featured_budget_cents,
  includes_featured = excluded.includes_featured,
  includes_bookings = excluded.includes_bookings,
  includes_analytics = excluded.includes_analytics,
  updated_at = now();


