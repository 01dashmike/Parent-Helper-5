-- Migration: Saved Searches and Alerts with proper structure
-- This updates the existing saved_searches table and creates alerts_log

-- Drop existing saved_searches table if it exists (will recreate with new structure)
-- Note: This will delete existing data. In production, you may want to migrate data first.
drop table if exists public.saved_searches cascade;

-- Create saved_searches table with required structure
create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,              -- full search string (e.g. q=music&town=london)
  town text,
  filters jsonb,                    -- optional structured filters
  created_at timestamptz not null default now(),
  last_alert_at timestamptz,
  alert_frequency text default 'weekly' check (alert_frequency in ('daily','weekly','none')),
  is_active boolean default true
);

create index if not exists saved_searches_user_idx on public.saved_searches(user_id);
create index if not exists saved_searches_created_idx on public.saved_searches(created_at);
create index if not exists saved_searches_active_idx on public.saved_searches(is_active);
create index if not exists saved_searches_frequency_idx on public.saved_searches(alert_frequency);

alter table public.saved_searches enable row level security;

-- RLS Policies for saved_searches
create policy "Users can insert own saved searches"
  on public.saved_searches
  for insert
  with check ( auth.uid() = user_id );

create policy "Users can view own saved searches"
  on public.saved_searches
  for select
  using ( auth.uid() = user_id );

create policy "Users can update own saved searches"
  on public.saved_searches
  for update
  using ( auth.uid() = user_id );

create policy "Users can delete own saved searches"
  on public.saved_searches
  for delete
  using ( auth.uid() = user_id );

-- Allow anonymous read for "teaser" searches (for display purposes)
-- This can be used to show example searches to non-authenticated users
create policy "Anonymous can view teaser searches"
  on public.saved_searches
  for select
  using ( false ); -- Set to true if you want to enable teaser searches

create policy "Service role can manage saved searches"
  on public.saved_searches
  for all
  using ( auth.role() = 'service_role' )
  with check ( auth.role() = 'service_role' );

-- Create alerts_log table
create table if not exists public.alerts_log (
  id uuid primary key default gen_random_uuid(),
  saved_search_id uuid not null references public.saved_searches(id) on delete cascade,
  sent_at timestamptz not null default now(),
  count_classes int not null default 0,
  preview_class text
);

create index if not exists alerts_log_search_idx on public.alerts_log(saved_search_id);
create index if not exists alerts_log_sent_idx on public.alerts_log(sent_at);

alter table public.alerts_log enable row level security;

-- RLS Policies for alerts_log
-- Users can view logs for their own saved searches
create policy "Users can view own alert logs"
  on public.alerts_log
  for select
  using (
    exists (
      select 1 from public.saved_searches
      where saved_searches.id = alerts_log.saved_search_id
      and saved_searches.user_id = auth.uid()
    )
  );

create policy "Service role can manage alert logs"
  on public.alerts_log
  for all
  using ( auth.role() = 'service_role' )
  with check ( auth.role() = 'service_role' );

