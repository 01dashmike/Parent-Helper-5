-- Provider Reviews System
-- Feature flag: REVIEWS_ENABLED=true

-- Add google_place_id to providers table if it doesn't exist
alter table public.providers
  add column if not exists google_place_id text;

create index if not exists providers_google_place_id_idx on public.providers(google_place_id) where google_place_id is not null;

-- Provider reviews table
create table if not exists public.provider_reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id integer not null references public.providers(id) on delete cascade,
  booking_id uuid references public.simple_bookings(id) on delete set null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  source text not null check (source in ('google', 'parenthelper')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_name text,
  reviewer_email text,
  google_review_id text,
  response_text text,
  response_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Provider reputation summary table
create table if not exists public.provider_reputation (
  provider_id integer primary key references public.providers(id) on delete cascade,
  avg_rating numeric(3,2) not null default 0.00,
  review_count integer not null default 0,
  google_review_count integer not null default 0,
  parenthelper_review_count integer not null default 0,
  last_sync timestamptz,
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists provider_reviews_provider_idx on public.provider_reviews(provider_id);
create index if not exists provider_reviews_status_idx on public.provider_reviews(status);
create index if not exists provider_reviews_source_idx on public.provider_reviews(source);
create index if not exists provider_reviews_booking_idx on public.provider_reviews(booking_id) where booking_id is not null;
create unique index if not exists provider_reviews_google_review_id_idx on public.provider_reviews(google_review_id) where google_review_id is not null;

-- Function to update provider reputation
create or replace function update_provider_reputation()
returns trigger as $$
begin
  insert into public.provider_reputation (provider_id, avg_rating, review_count, google_review_count, parenthelper_review_count, updated_at)
  values (
    new.provider_id,
    (select coalesce(avg(rating::numeric), 0) from public.provider_reviews where provider_id = new.provider_id and status = 'approved'),
    (select count(*) from public.provider_reviews where provider_id = new.provider_id and status = 'approved'),
    (select count(*) from public.provider_reviews where provider_id = new.provider_id and source = 'google' and status = 'approved'),
    (select count(*) from public.provider_reviews where provider_id = new.provider_id and source = 'parenthelper' and status = 'approved'),
    now()
  )
  on conflict (provider_id) do update set
    avg_rating = excluded.avg_rating,
    review_count = excluded.review_count,
    google_review_count = excluded.google_review_count,
    parenthelper_review_count = excluded.parenthelper_review_count,
    updated_at = excluded.updated_at;
  return new;
end;
$$ language plpgsql;

-- Trigger to update reputation on review insert/update
create trigger update_provider_reputation_on_review
  after insert or update of rating, status on public.provider_reviews
  for each row
  when (new.status = 'approved')
  execute function update_provider_reputation();

-- RLS policies
alter table public.provider_reviews enable row level security;
alter table public.provider_reputation enable row level security;

-- Service role can do everything
create policy if not exists "service role access - provider_reviews" on public.provider_reviews
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "service role access - provider_reputation" on public.provider_reputation
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Public can read approved reviews
create policy if not exists "public read approved reviews" on public.provider_reviews
  for select
  using (status = 'approved');

-- Public can read reputation
create policy if not exists "public read reputation" on public.provider_reputation
  for select
  using (true);

