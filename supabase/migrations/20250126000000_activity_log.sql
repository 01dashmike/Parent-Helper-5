-- Activity Log Migration
-- Creates activity_log table for admin activity feed

create table if not exists public.activity_log (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  
  -- what happened
  event_type text not null, -- e.g. 'provider.signup', 'class.created', 'booking.completed', 'email.sent', 'cron.weekly', 'stripe.payment.succeeded', 'error'
  
  -- which area
  scope text not null, -- e.g. 'provider', 'class', 'booking', 'billing', 'system', 'email'
  
  -- who/what
  actor_id uuid null,         -- optional: provider_user_id
  provider_id integer null,    -- references providers(id)
  class_id integer null,       -- references classes(id) if exists
  booking_id uuid null,        -- references bookings(id) if exists
  
  -- display text
  title text not null,
  description text null,
  
  -- details
  metadata jsonb null,
  
  -- severity
  level text not null default 'info' -- 'info' | 'warning' | 'error'
);

comment on table public.activity_log is 'Central activity feed for admin: providers, bookings, billing, emails, system events.';

-- Indexes for fast queries
create index if not exists activity_log_created_at_idx on public.activity_log(created_at desc);
create index if not exists activity_log_scope_idx on public.activity_log(scope);
create index if not exists activity_log_level_idx on public.activity_log(level);
create index if not exists activity_log_event_type_idx on public.activity_log(event_type);
create index if not exists activity_log_provider_id_idx on public.activity_log(provider_id) where provider_id is not null;
create index if not exists activity_log_class_id_idx on public.activity_log(class_id) where class_id is not null;

-- Composite index for common queries
create index if not exists activity_log_scope_created_idx on public.activity_log(scope, created_at desc);

-- Enable RLS
alter table public.activity_log enable row level security;

-- RLS Policies

-- Service role has full access
create policy if not exists "activity_log service role access"
  on public.activity_log
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Deny all for anonymous (admin access happens via server-side with service role)
create policy if not exists "activity_log deny anonymous"
  on public.activity_log
  for all
  using (false)
  with check (false);

