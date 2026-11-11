create table public.gym_reminder_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  scheduled_at timestamp with time zone not null,
  workout_date date not null,
  reminder_type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.gym_reminder_jobs enable row level security;

create policy "Users can manage their own reminder jobs"
on public.gym_reminder_jobs for all
to authenticated
using (auth.uid() = user_id);