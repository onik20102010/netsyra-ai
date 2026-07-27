-- Separate ide schema for Netsyra IDE
-- IDE token usage, files/chunks, project memory, and folder structure live here.
-- The Chat app does NOT use this schema.

create schema if not exists ide;

grant usage on schema ide to anon, authenticated;
grant all on all tables in schema ide to authenticated;
grant all on all sequences in schema ide to authenticated;
grant all on all functions in schema ide to authenticated;

-- =============================================
-- IDE USAGE & FILES
-- =============================================

create table if not exists ide.ide_token_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  tokens_used int default 0,
  requests_count int default 0,
  reset_at timestamptz default now()
);

create table if not exists ide.ide_files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  path text not null,
  content text not null default '',
  updated_at timestamptz default now(),
  unique (user_id, path)
);

create table if not exists ide.ide_file_chunks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  path text not null,
  content text not null,
  embedding vector(768) not null,
  chunk_index int not null,
  updated_at timestamptz default now()
);

-- =============================================
-- IDE PROJECT / FOLDER MEMORY
-- =============================================

create table if not exists ide.project_memory (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  memory jsonb not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id, project_id)
);

create table if not exists ide.user_folder_structure (
  user_id uuid primary key references auth.users(id) on delete cascade,
  structure text,
  updated_at timestamptz default now()
);

-- =============================================
-- INDEXES
-- =============================================

create index if not exists idx_ide_token_usage_user on ide.ide_token_usage (user_id);
create index if not exists idx_ide_files_user_path on ide.ide_files (user_id, path);
create index if not exists idx_ide_file_chunks_user_path on ide.ide_file_chunks (user_id, path);
create index if not exists idx_ide_file_chunks_embedding on ide.ide_file_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists idx_project_memory_user_project on ide.project_memory (user_id, project_id);
create index if not exists idx_project_memory_updated_at on ide.project_memory (updated_at desc);

-- =============================================
-- SECURITY DEFINER HELPERS
-- =============================================

create or replace function ide.ide_increment_token_usage(
  p_user_id uuid,
  p_tokens int,
  p_limit int default 100000
) returns boolean
language plpgsql
security definer
as $$
declare
  v_usage record;
begin
  insert into ide.ide_token_usage (user_id, tokens_used, reset_at)
  values (p_user_id, 0, now())
  on conflict (user_id) do nothing;

  update ide.ide_token_usage
  set tokens_used = 0,
      reset_at = now()
  where user_id = p_user_id
    and now() - reset_at > interval '24 hours';

  update ide.ide_token_usage
  set tokens_used = tokens_used + p_tokens
  where user_id = p_user_id
    and tokens_used + p_tokens <= p_limit;

  return found;
end;
$$;

create or replace function ide.reset_daily_tokens()
returns void
language plpgsql
security definer
as $$
begin
  update ide.ide_token_usage
  set tokens_used = 0, reset_at = now()
  where now() - reset_at > interval '24 hours';
end;
$$;

create or replace function ide.update_project_memory_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_project_memory_updated_at_trigger on ide.project_memory;
create trigger update_project_memory_updated_at_trigger
  before update on ide.project_memory
  for each row
  execute function ide.update_project_memory_updated_at();

-- =============================================
-- ENABLE RLS
-- =============================================

alter table ide.ide_token_usage enable row level security;
alter table ide.ide_files enable row level security;
alter table ide.ide_file_chunks enable row level security;
alter table ide.project_memory enable row level security;
alter table ide.user_folder_structure enable row level security;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Drop existing policies for safe re-run
drop policy if exists "Users can read own IDE usage" on ide.ide_token_usage;
drop policy if exists "Users can insert own IDE usage" on ide.ide_token_usage;
drop policy if exists "Users can update own IDE usage" on ide.ide_token_usage;
drop policy if exists "Users can read own IDE files" on ide.ide_files;
drop policy if exists "Users can insert own IDE files" on ide.ide_files;
drop policy if exists "Users can update own IDE files" on ide.ide_files;
drop policy if exists "Users can delete own IDE files" on ide.ide_files;
drop policy if exists "Users can read own IDE chunks" on ide.ide_file_chunks;
drop policy if exists "Users can insert own IDE chunks" on ide.ide_file_chunks;
drop policy if exists "Users can delete own IDE chunks" on ide.ide_file_chunks;
drop policy if exists "Users can view their own project memory" on ide.project_memory;
drop policy if exists "Users can insert their own project memory" on ide.project_memory;
drop policy if exists "Users can update their own project memory" on ide.project_memory;
drop policy if exists "Users can delete their own project memory" on ide.project_memory;
drop policy if exists "Users can view own folder structure" on ide.user_folder_structure;
drop policy if exists "Users can upsert own folder structure" on ide.user_folder_structure;
drop policy if exists "Users can update own folder structure" on ide.user_folder_structure;

-- ide_token_usage
create policy "Users can read own IDE usage"
  on ide.ide_token_usage for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own IDE usage"
  on ide.ide_token_usage for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own IDE usage"
  on ide.ide_token_usage for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ide_files
create policy "Users can read own IDE files"
  on ide.ide_files for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own IDE files"
  on ide.ide_files for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own IDE files"
  on ide.ide_files for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own IDE files"
  on ide.ide_files for delete to authenticated
  using (user_id = auth.uid());

-- ide_file_chunks
create policy "Users can read own IDE chunks"
  on ide.ide_file_chunks for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own IDE chunks"
  on ide.ide_file_chunks for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can delete own IDE chunks"
  on ide.ide_file_chunks for delete to authenticated
  using (user_id = auth.uid());

-- project_memory
create policy "Users can view their own project memory"
  on ide.project_memory for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own project memory"
  on ide.project_memory for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own project memory"
  on ide.project_memory for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own project memory"
  on ide.project_memory for delete to authenticated
  using (auth.uid() = user_id);

-- user_folder_structure
create policy "Users can view own folder structure"
  on ide.user_folder_structure for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can upsert own folder structure"
  on ide.user_folder_structure for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own folder structure"
  on ide.user_folder_structure for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
