-- Local Tips Migration
-- Creates local_tips table for city-specific expert tips carousel

-- 1. Local Tips table
create table if not exists public.local_tips (
  id uuid primary key default gen_random_uuid(),
  city_slug text not null, -- e.g., "london", "manchester", "national"
  author text not null,
  role text not null, -- e.g., "Local Parent", "Childcare Expert"
  content text not null, -- The tip text
  image_url text, -- Optional author image or tip image
  is_published boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Indexes
create index if not exists local_tips_city_slug_idx on public.local_tips(city_slug);
create index if not exists local_tips_published_idx on public.local_tips(is_published) where is_published = true;
create index if not exists local_tips_featured_idx on public.local_tips(is_featured) where is_featured = true;
create index if not exists local_tips_created_idx on public.local_tips(created_at);

-- 3. Updated_at trigger function (if not exists)
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 4. Add updated_at trigger
drop trigger if exists local_tips_set_updated_at on public.local_tips;
create trigger local_tips_set_updated_at
before update on public.local_tips
for each row
execute function public.touch_updated_at();

-- 5. Enable RLS
alter table public.local_tips enable row level security;

-- 6. RLS Policies

-- Service role has full access
create policy if not exists "local_tips service role access"
  on public.local_tips
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Public can read published tips
create policy if not exists "local_tips public read published"
  on public.local_tips
  for select
  using (is_published = true);

