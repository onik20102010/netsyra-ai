-- Add user memory summaries table for long-term user information
-- This stores evolving summaries of user preferences, interests, goals, etc.

create table if not exists public.user_memory_summaries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  summary text not null,
  last_updated_at timestamp with time zone default now(),
  message_count_at_update int default 0
);

-- Create index for faster lookups
create index if not exists idx_user_memory_summaries_user_id 
on public.user_memory_summaries(user_id);

-- Enable RLS
alter table public.user_memory_summaries enable row level security;

-- RLS Policies
create policy "Users can read own memory summary"
on public.user_memory_summaries
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own memory summary"
on public.user_memory_summaries
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own memory summary"
on public.user_memory_summaries
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
