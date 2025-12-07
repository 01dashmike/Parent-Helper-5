-- Booking MVP Migration
-- Creates bookings table, adds booking fields to occurrences, and sets up RLS policies

-- 1. Bookings table
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  occurrence_id uuid not null references public.class_occurrences(id) on delete cascade,
  provider_id integer not null references public.providers(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  email text not null,
  name text,
  phone text,
  amount_cents integer,
  currency text not null default 'gbp',
  status text not null default 'pending',
  stripe_payment_link_url text,
  stripe_checkout_id text,
  stripe_payment_intent_id text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(stripe_checkout_id)
);

-- 2. Add bookable and stripe_payment_link_url to class_occurrences (occurrences)
alter table public.class_occurrences
  add column if not exists bookable boolean not null default false,
  add column if not exists stripe_payment_link_url text;

-- 3. Webhook events table (for idempotency and logging)
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  source text,
  payload jsonb not null,
  processed boolean not null default false,
  error_message text,
  created_at timestamptz not null default now()
);

-- 4. Indexes
create index if not exists bookings_occurrence_idx on public.bookings(occurrence_id);
create index if not exists bookings_provider_idx on public.bookings(provider_id);
create index if not exists bookings_class_idx on public.bookings(class_id);
create index if not exists bookings_status_idx on public.bookings(status);
create index if not exists bookings_email_idx on public.bookings(email);
create index if not exists bookings_created_idx on public.bookings(created_at);
create index if not exists class_occurrences_bookable_idx on public.class_occurrences(bookable);
create index if not exists webhook_events_type_idx on public.webhook_events(type);
create index if not exists webhook_events_processed_idx on public.webhook_events(processed);
create index if not exists webhook_events_created_idx on public.webhook_events(created_at);

-- 5. Ensure touch_updated_at function exists
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 6. Add updated_at trigger to bookings
drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
before update on public.bookings
for each row
execute function public.touch_updated_at();

-- 7. Enable RLS
alter table public.bookings enable row level security;
alter table public.webhook_events enable row level security;

-- 8. RLS Policies for bookings

-- Service role has full access
create policy if not exists "bookings service role access"
  on public.bookings
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Providers can see their own bookings (via provider_id)
create policy if not exists "bookings providers read own"
  on public.bookings
  for select
  using (
    exists (
      select 1
      from public.providers_users pu
      where pu.provider_id = bookings.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  );

-- Providers can update their own bookings
create policy if not exists "bookings providers update own"
  on public.bookings
  for update
  using (
    exists (
      select 1
      from public.providers_users pu
      where pu.provider_id = bookings.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  )
  with check (
    exists (
      select 1
      from public.providers_users pu
      where pu.provider_id = bookings.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  );

-- Users can see their own bookings (email match with auth.users.email)
create policy if not exists "bookings users read own"
  on public.bookings
  for select
  using (
    exists (
      select 1
      from auth.users u
      where u.id = auth.uid()
        and lower(u.email) = lower(bookings.email)
    )
  );

-- Users can create bookings for themselves (email match)
create policy if not exists "bookings users insert own"
  on public.bookings
  for insert
  with check (
    exists (
      select 1
      from auth.users u
      where u.id = auth.uid()
        and lower(u.email) = lower(bookings.email)
    )
  );

-- Users can update their own bookings
create policy if not exists "bookings users update own"
  on public.bookings
  for update
  using (
    exists (
      select 1
      from auth.users u
      where u.id = auth.uid()
        and lower(u.email) = lower(bookings.email)
    )
  )
  with check (
    exists (
      select 1
      from auth.users u
      where u.id = auth.uid()
        and lower(u.email) = lower(bookings.email)
    )
  );

-- 9. RLS Policies for webhook_events (service role only)
create policy if not exists "webhook_events service role access"
  on public.webhook_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

