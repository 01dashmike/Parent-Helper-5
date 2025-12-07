create extension if not exists "pgcrypto";

-- Providers <-> Users mapping
create table if not exists public.providers_users (
  id uuid primary key default gen_random_uuid(),
  provider_id integer not null references public.providers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  status text not null default 'active',
  invited_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists providers_users_provider_user_idx
  on public.providers_users (provider_id, user_id);

create index if not exists providers_users_user_idx
  on public.providers_users (user_id);

-- Venues
create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  provider_id integer not null references public.providers(id) on delete cascade,
  name text not null,
  slug text,
  description text,
  phone text,
  email text,
  website text,
  address_line1 text,
  address_line2 text,
  city text,
  county text,
  postcode text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists venues_provider_slug_idx
  on public.venues (provider_id, slug)
  where slug is not null;

create index if not exists venues_provider_idx
  on public.venues (provider_id);

-- Provider managed classes
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  provider_id integer not null references public.providers(id) on delete cascade,
  venue_id uuid references public.venues(id) on delete set null,
  title text not null,
  slug text,
  summary text,
  description text,
  age_min_months integer,
  age_max_months integer,
  price text,
  booking_url text,
  is_published boolean not null default false,
  tags text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists classes_provider_slug_idx
  on public.classes (provider_id, slug)
  where slug is not null;

create index if not exists classes_provider_idx
  on public.classes (provider_id);

create index if not exists classes_venue_idx
  on public.classes (venue_id);

-- Individual class occurrences/sessions
create table if not exists public.class_occurrences (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  provider_id integer not null references public.providers(id) on delete cascade,
  venue_id uuid references public.venues(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer,
  price text,
  booking_url text,
  status text not null default 'scheduled',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists class_occurrences_class_idx
  on public.class_occurrences (class_id);

create index if not exists class_occurrences_provider_idx
  on public.class_occurrences (provider_id);

create index if not exists class_occurrences_starts_at_idx
  on public.class_occurrences (starts_at);

-- Images for providers, classes, or venues
create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  provider_id integer not null references public.providers(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  venue_id uuid references public.venues(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists images_provider_idx
  on public.images (provider_id);

create index if not exists images_class_idx
  on public.images (class_id);

create index if not exists images_venue_idx
  on public.images (venue_id);

-- Ensure helper function for updated_at timestamps
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Attach updated_at trigger to tables that require it
drop trigger if exists providers_users_set_updated_at on public.providers_users;
create trigger providers_users_set_updated_at
before update on public.providers_users
for each row
execute function public.touch_updated_at();

drop trigger if exists venues_set_updated_at on public.venues;
create trigger venues_set_updated_at
before update on public.venues
for each row
execute function public.touch_updated_at();

drop trigger if exists classes_set_updated_at on public.classes;
create trigger classes_set_updated_at
before update on public.classes
for each row
execute function public.touch_updated_at();

drop trigger if exists class_occurrences_set_updated_at on public.class_occurrences;
create trigger class_occurrences_set_updated_at
before update on public.class_occurrences
for each row
execute function public.touch_updated_at();

drop trigger if exists images_set_updated_at on public.images;
create trigger images_set_updated_at
before update on public.images
for each row
execute function public.touch_updated_at();

-- Add optional columns if table already existed
alter table public.classes
  add column if not exists summary text,
  add column if not exists age_min_months integer,
  add column if not exists age_max_months integer,
  add column if not exists price text,
  add column if not exists booking_url text,
  add column if not exists is_published boolean not null default false,
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.classes
  add column if not exists venue_id uuid references public.venues(id) on delete set null;

-- Row Level Security policies
alter table public.providers_users enable row level security;
alter table public.venues enable row level security;
alter table public.classes enable row level security;
alter table public.class_occurrences enable row level security;
alter table public.images enable row level security;

-- Providers Users policies
create policy if not exists "providers_users service role access"
  on public.providers_users
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "providers_users read same provider"
  on public.providers_users
  for select
  using (
    exists (
      select 1
      from public.providers_users pu
      where pu.provider_id = providers_users.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    ) or providers_users.user_id = auth.uid()
  );

create policy if not exists "providers_users manage self"
  on public.providers_users
  for update
  using (providers_users.user_id = auth.uid())
  with check (providers_users.user_id = auth.uid());

create policy if not exists "providers_users self insert"
  on public.providers_users
  for insert
  with check (providers_users.user_id = auth.uid());

-- Venues policies
create policy if not exists "venues service role access"
  on public.venues
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "venues read own provider"
  on public.venues
  for select
  using (
    exists (
      select 1 from public.providers_users pu
      where pu.provider_id = venues.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  );

create policy if not exists "venues insert own provider"
  on public.venues
  for insert
  with check (
    exists (
      select 1 from public.providers_users pu
      where pu.provider_id = venues.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  );

create policy if not exists "venues update own provider"
  on public.venues
  for update
  using (
    exists (
      select 1 from public.providers_users pu
      where pu.provider_id = venues.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.providers_users pu
      where pu.provider_id = venues.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  );

create policy if not exists "venues delete own provider"
  on public.venues
  for delete
  using (
    exists (
      select 1 from public.providers_users pu
      where pu.provider_id = venues.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  );

-- Classes policies
create policy if not exists "classes service role access"
  on public.classes
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "classes read own provider"
  on public.classes
  for select
  using (
    exists (
      select 1 from public.providers_users pu
      where pu.provider_id = classes.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  )
  or classes.is_published = true;

create policy if not exists "classes insert own provider"
  on public.classes
  for insert
  with check (
    exists (
      select 1 from public.providers_users pu
      where pu.provider_id = classes.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  );

create policy if not exists "classes update own provider"
  on public.classes
  for update
  using (
    exists (
      select 1 from public.providers_users pu
      where pu.provider_id = classes.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.providers_users pu
      where pu.provider_id = classes.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  );

create policy if not exists "classes delete own provider"
  on public.classes
  for delete
  using (
    exists (
      select 1 from public.providers_users pu
      where pu.provider_id = classes.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  );

-- Class occurrences policies
create policy if not exists "class_occurrences service role access"
  on public.class_occurrences
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "class_occurrences read own provider"
  on public.class_occurrences
  for select
  using (
    exists (
      select 1 from public.providers_users pu
      where pu.provider_id = class_occurrences.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  )
  or class_occurrences.status = 'published';

create policy if not exists "class_occurrences insert own provider"
  on public.class_occurrences
  for insert
  with check (
    exists (
      select 1 from public.providers_users pu
      where pu.provider_id = class_occurrences.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  );

create policy if not exists "class_occurrences update own provider"
  on public.class_occurrences
  for update
  using (
    exists (
      select 1 from public.providers_users pu
      where pu.provider_id = class_occurrences.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.providers_users pu
      where pu.provider_id = class_occurrences.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  );

create policy if not exists "class_occurrences delete own provider"
  on public.class_occurrences
  for delete
  using (
    exists (
      select 1 from public.providers_users pu
      where pu.provider_id = class_occurrences.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  );

-- Images policies
create policy if not exists "images service role access"
  on public.images
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "images read own provider"
  on public.images
  for select
  using (
    exists (
      select 1 from public.providers_users pu
      where pu.provider_id = images.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  );

create policy if not exists "images insert own provider"
  on public.images
  for insert
  with check (
    exists (
      select 1 from public.providers_users pu
      where pu.provider_id = images.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  );

create policy if not exists "images update own provider"
  on public.images
  for update
  using (
    exists (
      select 1 from public.providers_users pu
      where pu.provider_id = images.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.providers_users pu
      where pu.provider_id = images.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  );

create policy if not exists "images delete own provider"
  on public.images
  for delete
  using (
    exists (
      select 1 from public.providers_users pu
      where pu.provider_id = images.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  );

