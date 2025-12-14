-- Search Ranking v2 Migration
-- Adds ranking signals, monetisation fields, and user preferences

-- Add ranking and monetisation fields to classes table
alter table classes
  add column if not exists popularity_score real default 0,
  add column if not exists profile_quality_score real default 0,
  add column if not exists monetisation_tier text default 'free' check (monetisation_tier in ('free', 'featured', 'sponsored', 'enterprise')),
  add column if not exists featured_until timestamp with time zone,
  add column if not exists sponsored_until timestamp with time zone,
  add column if not exists last_booked_date date,
  add column if not exists search_rank_boost real default 0;

create index if not exists classes_popularity_score_idx on classes(popularity_score desc);
create index if not exists classes_monetisation_tier_idx on classes(monetisation_tier);
create index if not exists classes_featured_until_idx on classes(featured_until) where featured_until > now();
create index if not exists classes_sponsored_until_idx on classes(sponsored_until) where sponsored_until > now();

-- Add ranking fields to providers table
alter table providers
  add column if not exists popularity_score real default 0,
  add column if not exists profile_quality_score real default 0,
  add column if not exists monetisation_tier text default 'free' check (monetisation_tier in ('free', 'featured', 'sponsored', 'enterprise'));

-- Create user class preferences table for personalisation
create table if not exists user_class_preferences (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  preferred_categories text[] default '{}',
  preferred_age_min integer,
  preferred_age_max integer,
  recent_class_ids integer[] default '{}',
  last_city text,
  last_search_query text,
  updated_at timestamp with time zone default now() not null,
  unique(user_id)
);

create index if not exists user_class_preferences_user_id_idx on user_class_preferences(user_id);

-- Create materialized view for class ranking signals (30-day aggregated metrics)
create materialized view if not exists class_daily_metrics_30d as
select
  class_id,
  sum(views) as views_30d,
  sum(clicks) as clicks_30d,
  sum(bookings) as bookings_30d,
  sum(saves) as saves_30d,
  sum(time_on_page_seconds) as time_on_page_30d,
  case
    when sum(views) > 0 then sum(clicks)::float / sum(views)::float
    else 0.0
  end as ctr_30d,
  case
    when sum(clicks) > 0 then sum(bookings)::float / sum(clicks)::float
    else 0.0
  end as conversion_rate_30d,
  avg(distance_score) as avg_distance_score_30d
from class_daily_metrics
where date >= current_date - interval '30 days'
group by class_id;

create unique index if not exists class_daily_metrics_30d_class_id_idx on class_daily_metrics_30d(class_id);

-- Create view for class ranking signals (combines classes with metrics)
create or replace view v_class_ranking_signals as
select
  c.id as class_id,
  c.provider_id,
  c.category,
  c.age_group_min as age_min_months,
  c.age_group_max as age_max_months,
  c.latitude,
  c.longitude,
  c.town,
  c.name,
  c.description,
  c.popularity_score,
  c.profile_quality_score,
  c.monetisation_tier,
  c.featured_until,
  c.sponsored_until,
  c.last_booked_date,
  c.search_rank_boost,
  c.created_at,
  c.updated_at,
  c.is_active,
  c.rating,
  c.review_count,
  c.image_urls,
  coalesce(dm.views_30d, 0) as views_30d,
  coalesce(dm.clicks_30d, 0) as clicks_30d,
  coalesce(dm.bookings_30d, 0) as bookings_30d,
  coalesce(dm.saves_30d, 0) as saves_30d,
  coalesce(dm.time_on_page_30d, 0) as time_on_page_30d,
  coalesce(dm.ctr_30d, 0.0) as ctr_30d,
  coalesce(dm.conversion_rate_30d, 0.0) as conversion_rate_30d,
  coalesce(dm.avg_distance_score_30d, 0.0) as avg_distance_score_30d
from classes c
left join class_daily_metrics_30d dm on dm.class_id = c.id
where c.is_active = true;

-- Function to refresh materialized view (call periodically)
create or replace function refresh_class_ranking_signals()
returns void as $$
begin
  refresh materialized view concurrently class_daily_metrics_30d;
end;
$$ language plpgsql;

-- Update trigger for user_class_preferences
create trigger user_class_preferences_updated_at before update on user_class_preferences
  for each row execute function update_updated_at_column();








