-- Topic Hubs Migration
-- Creates topics table and junction tables for posts and classes

-- 1. Topics table
create table if not exists public.topics (
  slug text primary key,
  title text not null,
  description text not null,
  hero_image text,
  created_at timestamptz not null default now()
);

-- 2. Topic posts junction table
create table if not exists public.topic_posts (
  topic_slug text not null references public.topics(slug) on delete cascade,
  post_id integer not null references public.blog_posts_ai(id) on delete cascade,
  primary key (topic_slug, post_id)
);

-- 3. Topic classes junction table
create table if not exists public.topic_classes (
  topic_slug text not null references public.topics(slug) on delete cascade,
  class_id integer not null references public.classes(id) on delete cascade,
  primary key (topic_slug, class_id)
);

-- 4. Indexes for performance
create index if not exists topic_posts_topic_idx on public.topic_posts(topic_slug);
create index if not exists topic_posts_post_idx on public.topic_posts(post_id);
create index if not exists topic_classes_topic_idx on public.topic_classes(topic_slug);
create index if not exists topic_classes_class_idx on public.topic_classes(class_id);

-- 5. Enable RLS
alter table public.topics enable row level security;
alter table public.topic_posts enable row level security;
alter table public.topic_classes enable row level security;

-- 6. RLS Policies - public read access
create policy if not exists "topics public read"
  on public.topics
  for select
  using (true);

create policy if not exists "topic_posts public read"
  on public.topic_posts
  for select
  using (true);

create policy if not exists "topic_classes public read"
  on public.topic_classes
  for select
  using (true);

-- 7. RLS Policies - service role full access
create policy if not exists "topics service role access"
  on public.topics
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "topic_posts service role access"
  on public.topic_posts
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "topic_classes service role access"
  on public.topic_classes
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

