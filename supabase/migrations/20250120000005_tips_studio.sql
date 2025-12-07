-- Tips Studio Migration
-- Creates videos and video_jobs tables for managing short tip videos

-- 1. Videos table
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  provider_id integer references public.providers(id) on delete set null,
  uploader_id uuid references auth.users(id) on delete cascade,
  title text not null,
  script text,
  video_url text,
  thumbnail_url text,
  status text not null default 'draft',
  tags text[] default '{}',
  duration_seconds integer default 30,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

-- 2. Video jobs table (for background processing tasks)
create table if not exists public.video_jobs (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  type text not null, -- 'render', 'thumbnail', 'subtitle', etc.
  status text not null default 'pending', -- 'pending', 'processing', 'completed', 'failed'
  log jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Indexes
create index if not exists videos_provider_idx on public.videos(provider_id);
create index if not exists videos_uploader_idx on public.videos(uploader_id);
create index if not exists videos_status_idx on public.videos(status);
create index if not exists videos_published_idx on public.videos(published_at) where status = 'published';
create index if not exists videos_tags_idx on public.videos using gin(tags);
create index if not exists videos_created_idx on public.videos(created_at);
create index if not exists video_jobs_video_idx on public.video_jobs(video_id);
create index if not exists video_jobs_status_idx on public.video_jobs(status);
create index if not exists video_jobs_type_idx on public.video_jobs(type);

-- 4. Updated_at trigger function (if not exists)
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 5. Add updated_at triggers
drop trigger if exists videos_set_updated_at on public.videos;
create trigger videos_set_updated_at
before update on public.videos
for each row
execute function public.touch_updated_at();

drop trigger if exists video_jobs_set_updated_at on public.video_jobs;
create trigger video_jobs_set_updated_at
before update on public.video_jobs
for each row
execute function public.touch_updated_at();

-- 6. Enable RLS
alter table public.videos enable row level security;
alter table public.video_jobs enable row level security;

-- 7. RLS Policies for videos

-- Service role has full access
create policy if not exists "videos service role access"
  on public.videos
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Uploaders can read/write their own videos
create policy if not exists "videos uploaders read own"
  on public.videos
  for select
  using (uploader_id = auth.uid());

create policy if not exists "videos uploaders insert own"
  on public.videos
  for insert
  with check (uploader_id = auth.uid());

create policy if not exists "videos uploaders update own"
  on public.videos
  for update
  using (uploader_id = auth.uid())
  with check (uploader_id = auth.uid());

create policy if not exists "videos uploaders delete own"
  on public.videos
  for delete
  using (uploader_id = auth.uid());

-- Providers can read/write videos associated with their provider_id
create policy if not exists "videos providers read own"
  on public.videos
  for select
  using (
    provider_id is not null
    and exists (
      select 1
      from public.providers_users pu
      where pu.provider_id = videos.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  );

create policy if not exists "videos providers update own"
  on public.videos
  for update
  using (
    provider_id is not null
    and exists (
      select 1
      from public.providers_users pu
      where pu.provider_id = videos.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  )
  with check (
    provider_id is not null
    and exists (
      select 1
      from public.providers_users pu
      where pu.provider_id = videos.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  );

-- Published videos are public (read-only)
create policy if not exists "videos public read published"
  on public.videos
  for select
  using (status = 'published');

-- 8. RLS Policies for video_jobs (service role only for now)
create policy if not exists "video_jobs service role access"
  on public.video_jobs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Uploaders can read jobs for their videos
create policy if not exists "video_jobs uploaders read own"
  on public.video_jobs
  for select
  using (
    exists (
      select 1
      from public.videos v
      where v.id = video_jobs.video_id
        and v.uploader_id = auth.uid()
    )
  );

