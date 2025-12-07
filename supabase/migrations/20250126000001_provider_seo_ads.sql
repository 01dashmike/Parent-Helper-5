-- SEO & Ads Optimization Suite for Providers
-- Creates tables for SEO scoring, keyword insights, ad advice, and weekly summaries

-- 1. Provider SEO Score Table
create table if not exists public.provider_seo_score (
  id serial primary key,
  provider_id integer not null references public.providers(id) on delete cascade,
  score integer not null check (score >= 0 and score <= 100),
  title_quality integer default 0,
  description_clarity integer default 0,
  keyword_density integer default 0,
  category_match integer default 0,
  image_presence integer default 0,
  local_keywords_match integer default 0,
  review_data integer default 0,
  ctr_score integer default 0,
  field_completion integer default 0,
  issues jsonb default '[]'::jsonb,
  quick_fixes jsonb default '[]'::jsonb,
  keyword_opportunities jsonb default '[]'::jsonb,
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider_id, computed_at)
);

create index if not exists provider_seo_score_provider_idx on public.provider_seo_score(provider_id);
create index if not exists provider_seo_score_computed_at_idx on public.provider_seo_score(computed_at desc);

-- 2. Provider Keyword Insights Table
create table if not exists public.provider_keyword_insights (
  id serial primary key,
  provider_id integer not null references public.providers(id) on delete cascade,
  keyword text not null,
  search_volume integer default 0,
  competition_level text check (competition_level in ('low', 'medium', 'high')),
  relevance_score integer default 0 check (relevance_score >= 0 and relevance_score <= 100),
  current_ranking integer,
  opportunity_score integer default 0 check (opportunity_score >= 0 and opportunity_score <= 100),
  recommendation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists provider_keyword_insights_provider_idx on public.provider_keyword_insights(provider_id);
create index if not exists provider_keyword_insights_keyword_idx on public.provider_keyword_insights(keyword);
create index if not exists provider_keyword_insights_opportunity_idx on public.provider_keyword_insights(opportunity_score desc);

-- 3. Provider Ad Advice Table
create table if not exists public.provider_ad_advice (
  id serial primary key,
  provider_id integer not null references public.providers(id) on delete cascade,
  platform text not null check (platform in ('meta', 'tiktok', 'google', 'general')),
  targeting jsonb default '{}'::jsonb,
  ad_copy text,
  sample_headlines jsonb default '[]'::jsonb,
  recommended_budget_cents integer,
  hashtags jsonb default '[]'::jsonb,
  video_scripts jsonb default '[]'::jsonb,
  posting_schedule jsonb default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists provider_ad_advice_provider_idx on public.provider_ad_advice(provider_id);
create index if not exists provider_ad_advice_platform_idx on public.provider_ad_advice(platform);
create index if not exists provider_ad_advice_generated_at_idx on public.provider_ad_advice(generated_at desc);

-- 4. Provider Weekly Summary Logs Table
create table if not exists public.provider_weekly_summary_logs (
  id serial primary key,
  provider_id integer not null references public.providers(id) on delete cascade,
  week_start date not null,
  seo_score_trend jsonb default '{}'::jsonb,
  new_keyword_opportunities jsonb default '[]'::jsonb,
  top_fix text,
  ads_idea text,
  email_sent_at timestamptz,
  email_opened_at timestamptz,
  email_clicked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider_id, week_start)
);

create index if not exists provider_weekly_summary_logs_provider_idx on public.provider_weekly_summary_logs(provider_id);
create index if not exists provider_weekly_summary_logs_week_start_idx on public.provider_weekly_summary_logs(week_start desc);

-- Enable RLS
alter table public.provider_seo_score enable row level security;
alter table public.provider_keyword_insights enable row level security;
alter table public.provider_ad_advice enable row level security;
alter table public.provider_weekly_summary_logs enable row level security;

-- RLS Policies: Providers can view their own data
create policy "Providers can view their own SEO scores"
  on public.provider_seo_score
  for select
  using (
    exists (
      select 1 from public.provider_accounts
      where provider_accounts.provider_id = provider_seo_score.provider_id
      and provider_accounts.user_id = auth.uid()
    )
  );

create policy "Service role can manage SEO scores"
  on public.provider_seo_score
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Providers can view their own keyword insights"
  on public.provider_keyword_insights
  for select
  using (
    exists (
      select 1 from public.provider_accounts
      where provider_accounts.provider_id = provider_keyword_insights.provider_id
      and provider_accounts.user_id = auth.uid()
    )
  );

create policy "Service role can manage keyword insights"
  on public.provider_keyword_insights
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Providers can view their own ad advice"
  on public.provider_ad_advice
  for select
  using (
    exists (
      select 1 from public.provider_accounts
      where provider_accounts.provider_id = provider_ad_advice.provider_id
      and provider_accounts.user_id = auth.uid()
    )
  );

create policy "Service role can manage ad advice"
  on public.provider_ad_advice
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Providers can view their own weekly summaries"
  on public.provider_weekly_summary_logs
  for select
  using (
    exists (
      select 1 from public.provider_accounts
      where provider_accounts.provider_id = provider_weekly_summary_logs.provider_id
      and provider_accounts.user_id = auth.uid()
    )
  );

create policy "Service role can manage weekly summaries"
  on public.provider_weekly_summary_logs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Function to update updated_at timestamp
create or replace function update_provider_seo_ads_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_provider_seo_score_updated_at
  before update on public.provider_seo_score
  for each row
  execute function update_provider_seo_ads_updated_at();

create trigger update_provider_keyword_insights_updated_at
  before update on public.provider_keyword_insights
  for each row
  execute function update_provider_seo_ads_updated_at();

create trigger update_provider_ad_advice_updated_at
  before update on public.provider_ad_advice
  for each row
  execute function update_provider_seo_ads_updated_at();

create trigger update_provider_weekly_summary_logs_updated_at
  before update on public.provider_weekly_summary_logs
  for each row
  execute function update_provider_seo_ads_updated_at();

