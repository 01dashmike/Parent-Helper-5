-- Partners Migration
-- Creates partners table for featuring local cafes, parks, museums with affiliate options

-- 1. Partners table
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  city_slug text not null,
  name text not null,
  type text not null, -- 'cafe', 'park', 'museum', etc.
  url text not null,
  image_url text,
  summary text,
  is_featured boolean not null default false,
  affiliate_code text, -- Optional affiliate code for tracking
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Indexes
create index if not exists partners_city_slug_idx on public.partners(city_slug);
create index if not exists partners_type_idx on public.partners(type);
create index if not exists partners_featured_idx on public.partners(is_featured, city_slug);
create index if not exists partners_city_type_idx on public.partners(city_slug, type);

-- 3. Partner clicks tracking table for analytics
create table if not exists public.partner_clicks (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  city_slug text,
  session_id text,
  clicked_at timestamptz not null default now()
);

create index if not exists partner_clicks_partner_idx on public.partner_clicks(partner_id);
create index if not exists partner_clicks_city_idx on public.partner_clicks(city_slug);
create index if not exists partner_clicks_clicked_at_idx on public.partner_clicks(clicked_at);

-- 4. Ensure touch_updated_at function exists
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 5. Add updated_at trigger to partners
drop trigger if exists partners_set_updated_at on public.partners;
create trigger partners_set_updated_at
before update on public.partners
for each row
execute function public.touch_updated_at();

-- 6. Enable RLS
alter table public.partners enable row level security;
alter table public.partner_clicks enable row level security;

-- 7. RLS Policies for partners

-- Service role has full access
create policy if not exists "partners service role access"
  on public.partners
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Public can read published partners
create policy if not exists "partners public read"
  on public.partners
  for select
  using (true);

-- 8. RLS Policies for partner_clicks

-- Service role has full access
create policy if not exists "partner_clicks service role access"
  on public.partner_clicks
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Public can insert clicks (for tracking)
create policy if not exists "partner_clicks public insert"
  on public.partner_clicks
  for insert
  with check (true);

