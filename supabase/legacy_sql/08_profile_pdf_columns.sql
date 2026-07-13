alter table public.profiles
add column if not exists pdf_count int default 0,
add column if not exists pdf_reset_at timestamptz default now();
