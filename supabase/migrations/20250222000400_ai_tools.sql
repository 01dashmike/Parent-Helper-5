-- AI Tools for Providers Migration
-- Creates tables for AI usage tracking and caching

-- AI Usage Events (for metering, safety, and future monetisation)
create table if not exists ai_usage_events (
  id bigserial primary key,
  user_id uuid references users(id) on delete set null,
  provider_id integer references providers(id) on delete set null,
  tool_type text not null check (tool_type in (
    'class_copy',
    'schedule',
    'seo',
    'review_reply',
    'email_copy',
    'insight_coach',
    'onboarding'
  )),
  input_tokens integer,
  output_tokens integer,
  prompt_hash text,
  created_at timestamp with time zone default now() not null
);

create index if not exists ai_usage_events_user_id_created_at_idx on ai_usage_events(user_id, created_at desc);
create index if not exists ai_usage_events_provider_id_created_at_idx on ai_usage_events(provider_id, created_at desc);
create index if not exists ai_usage_events_tool_type_created_at_idx on ai_usage_events(tool_type, created_at desc);
create index if not exists ai_usage_events_prompt_hash_idx on ai_usage_events(prompt_hash);

-- AI Cached Suggestions (for regeneration and quick re-display)
create table if not exists ai_cached_suggestions (
  id bigserial primary key,
  user_id uuid references users(id) on delete set null,
  provider_id integer references providers(id) on delete set null,
  context_type text not null check (context_type in (
    'class',
    'provider_profile',
    'seo_page',
    'review',
    'email_campaign',
    'onboarding_step'
  )),
  context_id integer, -- e.g., class_id, review_id, etc.
  tool_type text not null check (tool_type in (
    'class_copy',
    'schedule',
    'seo',
    'review_reply',
    'email_copy',
    'insight_coach',
    'onboarding'
  )),
  input_fingerprint text not null, -- hash of input for deduplication
  output_json jsonb not null,
  created_at timestamp with time zone default now() not null,
  last_used_at timestamp with time zone default now() not null
);

create index if not exists ai_cached_suggestions_user_id_idx on ai_cached_suggestions(user_id);
create index if not exists ai_cached_suggestions_provider_id_idx on ai_cached_suggestions(provider_id);
create index if not exists ai_cached_suggestions_context_idx on ai_cached_suggestions(context_type, context_id);
create index if not exists ai_cached_suggestions_input_fingerprint_idx on ai_cached_suggestions(input_fingerprint);
create index if not exists ai_cached_suggestions_last_used_at_idx on ai_cached_suggestions(last_used_at desc);

-- Update trigger for last_used_at
create or replace function update_ai_cache_last_used()
returns trigger as $$
begin
  new.last_used_at = now();
  return new;
end;
$$ language plpgsql;

create trigger ai_cached_suggestions_update_last_used before update on ai_cached_suggestions
  for each row execute function update_ai_cache_last_used();





