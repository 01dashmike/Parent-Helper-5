-- Class Q&A Migration
-- Creates class_questions and class_answers tables for threaded Q&A with moderation

-- 1. Class Questions table
create table if not exists public.class_questions (
  id uuid primary key default gen_random_uuid(),
  class_id integer not null references public.classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  status text not null default 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Class Answers table
create table if not exists public.class_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.class_questions(id) on delete cascade,
  provider_id integer references public.providers(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Indexes
create index if not exists class_questions_class_idx on public.class_questions(class_id);
create index if not exists class_questions_user_idx on public.class_questions(user_id);
create index if not exists class_questions_status_idx on public.class_questions(status);
create index if not exists class_questions_created_idx on public.class_questions(created_at);
create index if not exists class_answers_question_idx on public.class_answers(question_id);
create index if not exists class_answers_provider_idx on public.class_answers(provider_id);
create index if not exists class_answers_user_idx on public.class_answers(user_id);

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
drop trigger if exists class_questions_set_updated_at on public.class_questions;
create trigger class_questions_set_updated_at
before update on public.class_questions
for each row
execute function public.touch_updated_at();

drop trigger if exists class_answers_set_updated_at on public.class_answers;
create trigger class_answers_set_updated_at
before update on public.class_answers
for each row
execute function public.touch_updated_at();

-- 6. Enable RLS
alter table public.class_questions enable row level security;
alter table public.class_answers enable row level security;

-- 7. RLS Policies for class_questions

-- Service role has full access
create policy if not exists "class_questions service role access"
  on public.class_questions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Users can read approved questions
create policy if not exists "class_questions public read approved"
  on public.class_questions
  for select
  using (status = 'approved');

-- Users can read their own questions (any status)
create policy if not exists "class_questions users read own"
  on public.class_questions
  for select
  using (user_id = auth.uid());

-- Users can create questions
create policy if not exists "class_questions users insert own"
  on public.class_questions
  for insert
  with check (user_id = auth.uid());

-- Providers can read questions for their classes
create policy if not exists "class_questions providers read own"
  on public.class_questions
  for select
  using (
    exists (
      select 1
      from public.classes c
      where c.id = class_questions.class_id
        and c.provider_id is not null
        and exists (
          select 1
          from public.provider_accounts pa
          where pa.provider_id = c.provider_id
            and pa.user_id = auth.uid()
            and pa.status = 'active'
        )
    )
  );

-- 8. RLS Policies for class_answers

-- Service role has full access
create policy if not exists "class_answers service role access"
  on public.class_answers
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Public can read answers for approved questions
create policy if not exists "class_answers public read"
  on public.class_answers
  for select
  using (
    exists (
      select 1
      from public.class_questions cq
      where cq.id = class_answers.question_id
        and cq.status = 'approved'
    )
  );

-- Providers can create answers for questions on their classes
create policy if not exists "class_answers providers insert"
  on public.class_answers
  for insert
  with check (
    provider_id is not null
    and exists (
      select 1
      from public.class_questions cq
      join public.classes c on c.id = cq.class_id
      where cq.id = class_answers.question_id
        and c.provider_id = class_answers.provider_id
        and exists (
          select 1
          from public.provider_accounts pa
          where pa.provider_id = c.provider_id
            and pa.user_id = auth.uid()
            and pa.status = 'active'
        )
    )
  );

-- Users can read their own answers
create policy if not exists "class_answers users read own"
  on public.class_answers
  for select
  using (user_id = auth.uid());

-- Users can create answers (for general questions)
create policy if not exists "class_answers users insert own"
  on public.class_answers
  for insert
  with check (user_id = auth.uid());

