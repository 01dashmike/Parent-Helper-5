-- Web Push Subscriptions Migration
-- Creates web_push_subscriptions table for storing browser push notification subscriptions

-- 1. Web push subscriptions table
create table if not exists public.web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, endpoint)
);

-- 2. User notification preferences table
create table if not exists public.user_notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  new_classes_near_me boolean not null default false,
  price_drops boolean not null default false,
  booking_reminders boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Booking reminders table
create table if not exists public.booking_reminders (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_sent_at timestamptz,
  reminder_scheduled_for timestamptz not null,
  created_at timestamptz not null default now()
);

-- 4. Indexes
create index if not exists web_push_subscriptions_user_idx on public.web_push_subscriptions(user_id);
create index if not exists web_push_subscriptions_endpoint_idx on public.web_push_subscriptions(endpoint);
create index if not exists user_notification_preferences_user_idx on public.user_notification_preferences(user_id);
create index if not exists booking_reminders_booking_idx on public.booking_reminders(booking_id);
create index if not exists booking_reminders_user_idx on public.booking_reminders(user_id);
create index if not exists booking_reminders_scheduled_idx on public.booking_reminders(reminder_scheduled_for) where reminder_sent_at is null;

-- 5. Ensure touch_updated_at function exists (may already exist from previous migrations)
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 6. Add updated_at triggers
drop trigger if exists web_push_subscriptions_set_updated_at on public.web_push_subscriptions;
create trigger web_push_subscriptions_set_updated_at
before update on public.web_push_subscriptions
for each row
execute function public.touch_updated_at();

drop trigger if exists user_notification_preferences_set_updated_at on public.user_notification_preferences;
create trigger user_notification_preferences_set_updated_at
before update on public.user_notification_preferences
for each row
execute function public.touch_updated_at();

-- 7. Enable RLS
alter table public.web_push_subscriptions enable row level security;
alter table public.user_notification_preferences enable row level security;
alter table public.booking_reminders enable row level security;

-- 8. RLS Policies for web_push_subscriptions
-- Service role has full access
create policy if not exists "web_push_subscriptions service role access"
  on public.web_push_subscriptions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Users can manage their own subscriptions
create policy if not exists "web_push_subscriptions users manage own"
  on public.web_push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 9. RLS Policies for user_notification_preferences
-- Service role has full access
create policy if not exists "user_notification_preferences service role access"
  on public.user_notification_preferences
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Users can manage their own preferences
create policy if not exists "user_notification_preferences users manage own"
  on public.user_notification_preferences
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 10. RLS Policies for booking_reminders
-- Service role has full access
create policy if not exists "booking_reminders service role access"
  on public.booking_reminders
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Users can see their own reminders
create policy if not exists "booking_reminders users read own"
  on public.booking_reminders
  for select
  using (auth.uid() = user_id);

-- Users can create reminders for their own bookings
create policy if not exists "booking_reminders users create own"
  on public.booking_reminders
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.bookings b
      where b.id = booking_reminders.booking_id
        and exists (
          select 1
          from auth.users u
          where u.id = auth.uid()
            and lower(u.email) = lower(b.email)
        )
    )
  );

