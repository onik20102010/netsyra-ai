alter table public.profiles
add column if not exists subscription_tier text default 'free',
add column if not exists subscription_expires_at timestamptz,
add column if not exists daily_message_count int default 0,
add column if not exists daily_reset_at timestamptz default now();
