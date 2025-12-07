-- Family Profiles Migration
-- Creates family_profiles, children, and saved_recommendations tables for personalized class discovery

-- 1. Family profiles table
create table if not exists public.family_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  home_town text,
  home_postcode text,
  interests text[] default '{}',
  allergies text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- 2. Children table
create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  first_name text not null,
  age_years integer,
  age_months integer not null,
  interests text[] default '{}',
  allergies text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Saved recommendations table
create table if not exists public.saved_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id integer not null references public.classes(id) on delete cascade,
  reason text,
  score numeric(5, 2) not null,
  created_at timestamptz not null default now(),
  unique(user_id, class_id)
);

-- 4. Indexes
create index if not exists family_profiles_user_idx on public.family_profiles(user_id);
create index if not exists children_family_idx on public.children(family_id);
create index if not exists saved_recommendations_user_idx on public.saved_recommendations(user_id);
create index if not exists saved_recommendations_class_idx on public.saved_recommendations(class_id);
create index if not exists saved_recommendations_score_idx on public.saved_recommendations(score desc);
create index if not exists saved_recommendations_created_idx on public.saved_recommendations(created_at desc);

-- 5. Updated_at trigger function (if not exists)
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 6. Add updated_at triggers
drop trigger if exists family_profiles_set_updated_at on public.family_profiles;
create trigger family_profiles_set_updated_at
before update on public.family_profiles
for each row
execute function public.touch_updated_at();

drop trigger if exists children_set_updated_at on public.children;
create trigger children_set_updated_at
before update on public.children
for each row
execute function public.touch_updated_at();

-- 7. Enable RLS
alter table public.family_profiles enable row level security;
alter table public.children enable row level security;
alter table public.saved_recommendations enable row level security;

-- 8. RLS Policies for family_profiles

-- Service role has full access
create policy if not exists "family_profiles service role access"
  on public.family_profiles
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Users can read/write their own family profile
create policy if not exists "family_profiles users read own"
  on public.family_profiles
  for select
  using (user_id = auth.uid());

create policy if not exists "family_profiles users insert own"
  on public.family_profiles
  for insert
  with check (user_id = auth.uid());

create policy if not exists "family_profiles users update own"
  on public.family_profiles
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy if not exists "family_profiles users delete own"
  on public.family_profiles
  for delete
  using (user_id = auth.uid());

-- 9. RLS Policies for children

-- Service role has full access
create policy if not exists "children service role access"
  on public.children
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Users can read/write children in their family profile
create policy if not exists "children users read own"
  on public.children
  for select
  using (
    exists (
      select 1
      from public.family_profiles fp
      where fp.id = children.family_id
        and fp.user_id = auth.uid()
    )
  );

create policy if not exists "children users insert own"
  on public.children
  for insert
  with check (
    exists (
      select 1
      from public.family_profiles fp
      where fp.id = children.family_id
        and fp.user_id = auth.uid()
    )
  );

create policy if not exists "children users update own"
  on public.children
  for update
  using (
    exists (
      select 1
      from public.family_profiles fp
      where fp.id = children.family_id
        and fp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.family_profiles fp
      where fp.id = children.family_id
        and fp.user_id = auth.uid()
    )
  );

create policy if not exists "children users delete own"
  on public.children
  for delete
  using (
    exists (
      select 1
      from public.family_profiles fp
      where fp.id = children.family_id
        and fp.user_id = auth.uid()
    )
  );

-- 10. RLS Policies for saved_recommendations

-- Service role has full access
create policy if not exists "saved_recommendations service role access"
  on public.saved_recommendations
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Users can read/write their own recommendations
create policy if not exists "saved_recommendations users read own"
  on public.saved_recommendations
  for select
  using (user_id = auth.uid());

create policy if not exists "saved_recommendations users insert own"
  on public.saved_recommendations
  for insert
  with check (user_id = auth.uid());

create policy if not exists "saved_recommendations users update own"
  on public.saved_recommendations
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy if not exists "saved_recommendations users delete own"
  on public.saved_recommendations
  for delete
  using (user_id = auth.uid());

