-- Events Cache Migration
-- Creates events_cache table for caching Eventbrite events with expiration

create table if not exists public.events_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  latitude numeric(10, 8) not null,
  longitude numeric(11, 8) not null,
  radius_km integer not null,
  events_data jsonb not null default '[]'::jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for efficient lookups
create index if not exists events_cache_key_idx on public.events_cache(cache_key);
create index if not exists events_cache_expires_idx on public.events_cache(expires_at);
create index if not exists events_cache_location_idx on public.events_cache(latitude, longitude);

-- Function to automatically clean up expired cache entries
create or replace function cleanup_expired_events_cache()
returns void
language plpgsql
as $$
begin
  delete from public.events_cache
  where expires_at < now();
end;
$$;

-- RLS policies (if RLS is enabled)
alter table public.events_cache enable row level security;

-- Allow public read access (for API routes)
create policy "Allow public read access to events_cache"
  on public.events_cache
  for select
  using (true);

-- Allow service role to insert/update/delete
create policy "Allow service role full access to events_cache"
  on public.events_cache
  for all
  using (true)
  with check (true);

