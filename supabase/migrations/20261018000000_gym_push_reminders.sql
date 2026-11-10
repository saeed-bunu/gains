create table if not exists public.gym_schedules (
  user_id uuid primary key references auth.users (id) on delete cascade,
  training_days smallint[] not null
    check (cardinality(training_days) between 2 and 6),
  gym_time time without time zone not null,
  timezone text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

create table if not exists public.workout_checkins (
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_date date not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, workout_date)
);

create table if not exists public.gym_reminder_deliveries (
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_date date not null,
  reminder_type text not null check (reminder_type in ('before', 'missed')),
  sent_at timestamptz not null default now(),
  primary key (user_id, workout_date, reminder_type)
);

alter table public.gym_schedules enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.workout_checkins enable row level security;
alter table public.gym_reminder_deliveries enable row level security;

grant select, insert, update, delete on public.gym_schedules to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant select, insert, update, delete on public.workout_checkins to authenticated;
grant usage, select on sequence public.push_subscriptions_id_seq to authenticated;

create policy "Users manage their gym schedule"
  on public.gym_schedules for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their push subscriptions"
  on public.push_subscriptions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their workout check-ins"
  on public.workout_checkins for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.gym_reminder_deliveries from anon, authenticated;
