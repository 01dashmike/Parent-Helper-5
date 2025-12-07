-- AI Personalisation Migration
-- Creates tables for family profiles, child profiles, user preferences, recommendations, and provider quality cache

-- 1. Family profiles table
create table if not exists public.family_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  household_name text,
  postcode text,
  home_lat numeric(9,6),
  home_lng numeric(9,6),
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Child profiles table
create table if not exists public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  first_name text,
  birthdate date not null,
  age_months int generated always as (
    floor(EXTRACT(epoch from (now() - birthdate)) / 2629800)
  ) stored,
  interests text[] default '{}',
  allergies text[] default '{}',
  accessibility_needs text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. User preferences table
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  default_radius_km int not null default 10,
  preferred_days text[] default '{}',
  preferred_times text[] default '{}',
  preferred_categories text[] default '{}',
  newsletter_frequency text not null default 'weekly', -- 'off'|'weekly'|'biweekly'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Enhance saved_searches table (if it exists, add missing columns)
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'saved_searches') then
    -- Add columns if they don't exist
    if not exists (select 1 from information_schema.columns where table_name = 'saved_searches' and column_name = 'name') then
      alter table public.saved_searches add column name text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'saved_searches' and column_name = 'cadence') then
      alter table public.saved_searches add column cadence text default 'weekly';
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'saved_searches' and column_name = 'last_sent_at') then
      alter table public.saved_searches add column last_sent_at timestamptz;
    end if;
  else
    -- Create table if it doesn't exist
    create table public.saved_searches (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users(id) on delete cascade,
      name text,
      params jsonb not null,
      cadence text default 'weekly',
      last_sent_at timestamptz,
      created_at timestamptz not null default now()
    );
  end if;
end $$;

-- 5. Recommendations table
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id integer not null references public.classes(id) on delete cascade,
  score numeric not null,
  rationale text,
  generated_at timestamptz not null default now(),
  expires_at timestamptz,
  constraint recommendations_user_class_generated_unique unique(user_id, class_id, generated_at)
);

-- 6. Provider quality cache table
create table if not exists public.provider_quality_cache (
  provider_id integer primary key references public.providers(id) on delete cascade,
  quality_score numeric not null default 0,
  reviews_count integer not null default 0,
  completion_rate numeric not null default 0,
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists family_profiles_user_idx on public.family_profiles(user_id);
create index if not exists child_profiles_family_idx on public.child_profiles(family_id);
create index if not exists child_profiles_age_idx on public.child_profiles(age_months);
create index if not exists user_preferences_user_idx on public.user_preferences(user_id);
create index if not exists saved_searches_user_idx on public.saved_searches(user_id);
create index if not exists saved_searches_cadence_idx on public.saved_searches(cadence, last_sent_at);
create index if not exists recommendations_user_idx on public.recommendations(user_id, expires_at);
create index if not exists recommendations_class_idx on public.recommendations(class_id);
create index if not exists recommendations_score_idx on public.recommendations(score desc);
create index if not exists provider_quality_cache_updated_idx on public.provider_quality_cache(updated_at);

-- Helper function: Calculate distance between two points (Haversine formula)
create or replace function nearest_point_distance(
  lat1 numeric,
  lng1 numeric,
  lat2 numeric,
  lng2 numeric
) returns numeric
language plpgsql
immutable
as $$
declare
  earth_radius_km numeric := 6371;
  dlat numeric;
  dlng numeric;
  a numeric;
  c numeric;
begin
  if lat1 is null or lng1 is null or lat2 is null or lng2 is null then
    return null;
  end if;

  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);

  a := sin(dlat/2) * sin(dlat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlng/2) * sin(dlng/2);

  c := 2 * atan2(sqrt(a), sqrt(1-a));

  return earth_radius_km * c;
end;
$$;

-- Function to update updated_at timestamp
create or replace function update_personalisation_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_family_profiles_updated_at
  before update on public.family_profiles
  for each row
  execute function update_personalisation_updated_at();

create trigger update_child_profiles_updated_at
  before update on public.child_profiles
  for each row
  execute function update_personalisation_updated_at();

create trigger update_user_preferences_updated_at
  before update on public.user_preferences
  for each row
  execute function update_personalisation_updated_at();

-- Enable RLS
alter table public.family_profiles enable row level security;
alter table public.child_profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.recommendations enable row level security;
alter table public.provider_quality_cache enable row level security;

-- RLS Policies for family_profiles
create policy if not exists "family_profiles users select own"
  on public.family_profiles
  for select
  using (auth.uid() = user_id);

create policy if not exists "family_profiles users update own"
  on public.family_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "family_profiles users insert own"
  on public.family_profiles
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "family_profiles service role access"
  on public.family_profiles
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- RLS Policies for child_profiles (via family_id join)
create policy if not exists "child_profiles users select own"
  on public.child_profiles
  for select
  using (
    exists (
      select 1 from public.family_profiles
      where family_profiles.id = child_profiles.family_id
        and family_profiles.user_id = auth.uid()
    )
  );

create policy if not exists "child_profiles users update own"
  on public.child_profiles
  for update
  using (
    exists (
      select 1 from public.family_profiles
      where family_profiles.id = child_profiles.family_id
        and family_profiles.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.family_profiles
      where family_profiles.id = child_profiles.family_id
        and family_profiles.user_id = auth.uid()
    )
  );

create policy if not exists "child_profiles users insert own"
  on public.child_profiles
  for insert
  with check (
    exists (
      select 1 from public.family_profiles
      where family_profiles.id = child_profiles.family_id
        and family_profiles.user_id = auth.uid()
    )
  );

create policy if not exists "child_profiles service role access"
  on public.child_profiles
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- RLS Policies for user_preferences
create policy if not exists "user_preferences users select own"
  on public.user_preferences
  for select
  using (auth.uid() = user_id);

create policy if not exists "user_preferences users update own"
  on public.user_preferences
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "user_preferences users insert own"
  on public.user_preferences
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "user_preferences service role access"
  on public.user_preferences
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- RLS Policies for recommendations
create policy if not exists "recommendations users select own"
  on public.recommendations
  for select
  using (auth.uid() = user_id);

create policy if not exists "recommendations service role access"
  on public.recommendations
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- RLS Policies for provider_quality_cache
create policy if not exists "provider_quality_cache public select"
  on public.provider_quality_cache
  for select
  using (true);

create policy if not exists "provider_quality_cache service role access"
  on public.provider_quality_cache
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

