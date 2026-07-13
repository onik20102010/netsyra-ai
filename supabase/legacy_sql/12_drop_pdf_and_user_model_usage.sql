alter table public.profiles
drop column if exists pdf_count,
drop column if exists pdf_reset_at;

drop table if exists public.user_model_usage;
