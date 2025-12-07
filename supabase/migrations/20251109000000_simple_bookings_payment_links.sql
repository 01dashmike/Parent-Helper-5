-- Simple bookings using Stripe Payment Links
-- Feature flag: FEATURE_BOOKINGS=true

-- Simplified bookings table for Payment Links (separate from full booking system)
create table if not exists public.simple_bookings (
  id uuid primary key default gen_random_uuid(),
  occurrence_id integer not null references public.session_instances(id) on delete cascade,
  email text not null,
  amount_cents integer not null,
  currency text not null default 'gbp',
  status text not null default 'pending',
  stripe_payment_link_url text,
  stripe_checkout_id text,
  created_at timestamptz not null default now(),
  unique(stripe_checkout_id)
);

-- Add bookable and payment link URL to session_instances (occurrences)
alter table public.session_instances
  add column if not exists bookable boolean not null default false,
  add column if not exists stripe_payment_link_url text;

-- Webhook events log for idempotency
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists simple_bookings_occurrence_idx on public.simple_bookings(occurrence_id);
create index if not exists simple_bookings_status_idx on public.simple_bookings(status);
create index if not exists session_instances_bookable_idx on public.session_instances(bookable);
create index if not exists webhook_events_type_idx on public.webhook_events(type);
create index if not exists webhook_events_created_idx on public.webhook_events(created_at);

-- RLS policies (service role only for now)
alter table public.simple_bookings enable row level security;
alter table public.webhook_events enable row level security;

create policy if not exists "service role access - simple_bookings" on public.simple_bookings
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "service role access - webhook_events" on public.webhook_events
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

