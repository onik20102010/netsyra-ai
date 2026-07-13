create table if not exists public.user_model_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  model_id text not null,
  tokens_used int default 0,
  messages_sent int default 0,
  reset_at timestamptz default now(),
  unique (user_id, model_id)
);

-- Allow users to read/write their own usage
alter table public.user_model_usage enable row level security;

create policy "Users can read own model usage"
on public.user_model_usage
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own model usage"
on public.user_model_usage
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own model usage"
on public.user_model_usage
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
