-- Marketing Automation Triggers
-- These triggers call webhooks/API endpoints when events occur

-- Function to call webhook (HTTP request)
create or replace function http_post(url text, body jsonb)
returns void
language plpgsql
as $$
begin
  -- This will be handled by Supabase Edge Functions or external webhook
  -- For now, we'll use pg_net extension if available, or log to a queue table
  perform net.http_post(
    url := url,
    body := body::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json')
  );
exception
  when others then
    -- Fallback: log to a queue table for processing
    insert into public.webhook_queue (url, payload, created_at)
    values (url, body, now());
end;
$$;

-- Create webhook queue table if it doesn't exist
create table if not exists public.webhook_queue (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  payload jsonb not null,
  status text default 'pending',
  created_at timestamptz not null default now()
);

-- Trigger function for user signup
create or replace function trigger_marketing_user_signup()
returns trigger
language plpgsql
security definer
as $$
declare
  webhook_url text;
begin
  -- Only trigger if marketing automation is enabled (check via config table or env)
  webhook_url := current_setting('app.marketing_webhook_url', true);
  
  if webhook_url is null then
    webhook_url := 'https://' || current_setting('app.site_url', true) || '/api/marketing/trigger';
  end if;

  -- Call webhook to trigger automation
  perform http_post(
    webhook_url,
    jsonb_build_object(
      'triggerType', 'user_signup',
      'userId', new.id::text,
      'email', new.email,
      'context', jsonb_build_object(
        'firstName', coalesce(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1))
      )
    )
  );

  -- Log activity
  insert into public.user_activity_log (user_id, activity_type, metadata)
  values (new.id, 'signup', jsonb_build_object('email', new.email));

  return new;
end;
$$;

-- Trigger on user creation
drop trigger if exists on_user_signup_marketing on auth.users;
create trigger on_user_signup_marketing
  after insert on auth.users
  for each row
  execute function trigger_marketing_user_signup();

-- Trigger function for first booking
create or replace function trigger_marketing_first_booking()
returns trigger
language plpgsql
security definer
as $$
declare
  webhook_url text;
  user_email text;
  user_id uuid;
  booking_count integer;
begin
  -- Get user email from booking
  user_email := new.email;
  
  -- Find user ID from auth.users
  select id into user_id from auth.users where email = user_email limit 1;
  
  if user_id is null then
    return new;
  end if;

  -- Check if this is the first booking
  select count(*) into booking_count
  from public.simple_bookings
  where email = user_email
    and status = 'confirmed'
    and id != new.id;

  -- Only trigger if this is the first booking
  if booking_count = 0 then
    webhook_url := current_setting('app.marketing_webhook_url', true);
    
    if webhook_url is null then
      webhook_url := 'https://' || current_setting('app.site_url', true) || '/api/marketing/trigger';
    end if;

    -- Call webhook
    perform http_post(
      webhook_url,
      jsonb_build_object(
        'triggerType', 'first_booking',
        'userId', user_id::text,
        'email', user_email,
        'context', jsonb_build_object(
          'bookingId', new.id::text
        )
      )
    );

    -- Log activity
    insert into public.user_activity_log (user_id, activity_type, metadata)
    values (user_id, 'booking', jsonb_build_object('booking_id', new.id::text));
  end if;

  return new;
end;
$$;

-- Trigger on booking confirmation
drop trigger if exists on_first_booking_marketing on public.simple_bookings;
create trigger on_first_booking_marketing
  after insert on public.simple_bookings
  for each row
  when (new.status = 'confirmed')
  execute function trigger_marketing_first_booking();

-- Note: Inactivity and other triggers are handled by cron jobs checking user_activity_log
-- See app/api/cron/check-inactivity/route.ts

