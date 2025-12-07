-- Analytics Event Tracking System
-- Creates tables for raw events and aggregated daily metrics
-- Similar to ClassPass, Treatwell, and Happity's analytics structure

-- Table 1: Raw Events
create table if not exists analytics_events (
  id bigserial primary key,
  event_type text not null,
  provider_id bigint,
  class_id bigint,
  user_id uuid,
  session_id text,
  metadata jsonb default '{}'::jsonb,
  occurred_at timestamptz default now()
);

-- Indexes for analytics_events
create index if not exists analytics_events_provider_id_idx on analytics_events (provider_id);
create index if not exists analytics_events_class_id_idx on analytics_events (class_id);
create index if not exists analytics_events_event_type_idx on analytics_events (event_type);
create index if not exists analytics_events_occurred_at_idx on analytics_events (occurred_at);
create index if not exists analytics_events_session_id_idx on analytics_events (session_id);

-- Composite index for common queries
create index if not exists analytics_events_provider_date_idx on analytics_events (provider_id, date(occurred_at));
create index if not exists analytics_events_class_date_idx on analytics_events (class_id, date(occurred_at));

-- Table 2: Aggregated Provider Metrics (Daily)
create table if not exists provider_daily_metrics (
  id bigserial primary key,
  provider_id bigint not null,
  date date not null,
  views int default 0,
  bookings int default 0,
  revenue numeric(10, 2) default 0,
  search_impressions int default 0,
  search_clicks int default 0,
  website_clicks int default 0,
  phone_clicks int default 0,
  time_on_page_seconds int default 0,
  scroll_depth_50 int default 0,
  scroll_depth_75 int default 0,
  scroll_depth_100 int default 0,
  cta_clicks int default 0,
  gallery_opens int default 0,
  video_plays int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(provider_id, date)
);

-- Indexes for provider_daily_metrics
create index if not exists provider_daily_metrics_provider_id_idx on provider_daily_metrics (provider_id);
create index if not exists provider_daily_metrics_date_idx on provider_daily_metrics (date);
create index if not exists provider_daily_metrics_provider_date_idx on provider_daily_metrics (provider_id, date);

-- Table 3: Aggregated Class Metrics (Daily)
create table if not exists class_daily_metrics (
  id bigserial primary key,
  class_id bigint not null,
  date date not null,
  views int default 0,
  search_impressions int default 0,
  search_clicks int default 0,
  website_clicks int default 0,
  phone_clicks int default 0,
  time_on_page_seconds int default 0,
  scroll_depth_50 int default 0,
  scroll_depth_75 int default 0,
  scroll_depth_100 int default 0,
  cta_clicks int default 0,
  gallery_opens int default 0,
  video_plays int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(class_id, date)
);

-- Indexes for class_daily_metrics
create index if not exists class_daily_metrics_class_id_idx on class_daily_metrics (class_id);
create index if not exists class_daily_metrics_date_idx on class_daily_metrics (date);
create index if not exists class_daily_metrics_class_date_idx on class_daily_metrics (class_id, date);

-- Foreign key constraints (optional, can be added if needed)
-- alter table analytics_events add constraint fk_provider foreign key (provider_id) references providers(id) on delete set null;
-- alter table analytics_events add constraint fk_class foreign key (class_id) references classes(id) on delete set null;
-- alter table provider_daily_metrics add constraint fk_provider_metrics foreign key (provider_id) references providers(id) on delete cascade;
-- alter table class_daily_metrics add constraint fk_class_metrics foreign key (class_id) references classes(id) on delete cascade;

-- Comments for documentation
comment on table analytics_events is 'Raw analytics events from client-side tracking';
comment on table provider_daily_metrics is 'Aggregated daily metrics per provider';
comment on table class_daily_metrics is 'Aggregated daily metrics per class';

comment on column analytics_events.event_type is 'Type of event: class_view, profile_view, search_impression, etc.';
comment on column analytics_events.metadata is 'Additional event data (JSON)';
comment on column analytics_events.session_id is 'Anonymous session identifier';





