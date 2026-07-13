-- Run in Supabase SQL Editor
alter table public.profiles
add column if not exists message_count int default 0,
add column if not exists message_reset_at timestamptz default now();

-- Allow users to update their own profile
create policy if not exists "Users can update own profile"
on public.profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
