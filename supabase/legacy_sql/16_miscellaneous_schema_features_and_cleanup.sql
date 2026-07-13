select * from public.memories order by created_at desc limit 10;

drop policy if exists "Users can read own episodic memories" on public.episodic_memories;
drop policy if exists "Users can insert own episodic memories" on public.episodic_memories;

create policy "Users can read own episodic memories"
on public.episodic_memories
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own episodic memories"
on public.episodic_memories
for insert
to authenticated
with check (user_id = auth.uid());


create table if not exists public.episodic_memories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  user_message text not null,
  assistant_reply text not null,
  created_at timestamp with time zone default now()
);

alter table public.episodic_memories enable row level security;

create policy "Users can read own episodic memories"
on public.episodic_memories
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own episodic memories"
on public.episodic_memories
for insert
to authenticated
with check (user_id = auth.uid());


drop table if exists public.episodic_memories;


alter table public.profiles
add column if not exists goal text;


alter table public.profiles
add column if not exists custom_instructions text;


alter table public.conversations
add column if not exists folder text default '',
add column if not exists pinned boolean default false,
add column if not exists archived boolean default false;


-- =============================================
-- DROP OLD OBJECTS (one time only)
-- =============================================
drop table if exists public.group_members cascade;

drop table if exists public.group_chats cascade;

drop function if exists public.lookup_group_by_code cascade;

drop function if exists public.is_group_member cascade;

drop function if exists public.is_member_of_group cascade;

-- =============================================
-- CREATE TABLES
-- =============================================
create table public.group_chats (
  id uuid default gen_random_uuid () primary key,
  name text not null,
  invite_code text unique not null,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default now()
);

create table public.group_members (
  id uuid default gen_random_uuid () primary key,
  group_id uuid references public.group_chats on delete cascade not null,
  user_id uuid references auth.users not null,
  joined_at timestamp with time zone default now(),
  unique (group_id, user_id)
);

-- =============================================
-- ADD GROUP_ID TO CONVERSATIONS (safe)
-- =============================================
alter table public.conversations
add column if not exists group_id uuid references public.group_chats on delete cascade;

-- =============================================
-- SECURITY DEFINER FUNCTIONS
-- =============================================
-- Look up a group by invite code (used by join page)
create or replace function public.lookup_group_by_code (p_code text) returns table (
  id uuid,
  name text,
  invite_code text,
  created_by uuid
) language sql security definer as $$
  select id, name, invite_code, created_by
  from public.group_chats
  where invite_code = p_code
  limit 1;
$$;

-- Check if current user is a member of a group (avoids recursion)
create or replace function public.is_member_of_group (p_group_id uuid) returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id
      and user_id = auth.uid()
  );
$$;

-- =============================================
-- ENABLE RLS
-- =============================================
alter table public.group_chats enable row level security;

alter table public.group_members enable row level security;

-- =============================================
-- DROP OLD POLICIES (safe)
-- =============================================
do $$
begin
  -- Drop any existing policies to avoid conflicts
  if exists (select 1 from pg_policies where policyname = 'Anyone can create a group' and tablename = 'group_chats') then
    drop policy "Anyone can create a group" on public.group_chats;
  end if;
  if exists (select 1 from pg_policies where policyname = 'Members can read their groups' and tablename = 'group_chats') then
    drop policy "Members can read their groups" on public.group_chats;
  end if;
  if exists (select 1 from pg_policies where policyname = 'Members can see member list' and tablename = 'group_members') then
    drop policy "Members can see member list" on public.group_members;
  end if;
  if exists (select 1 from pg_policies where policyname = 'Anyone can join a group' and tablename = 'group_members') then
    drop policy "Anyone can join a group" on public.group_members;
  end if;
  if exists (select 1 from pg_policies where policyname = 'Owner or group members can read' and tablename = 'conversations') then
    drop policy "Owner or group members can read" on public.conversations;
  end if;
  if exists (select 1 from pg_policies where policyname = 'Owner or group members can insert' and tablename = 'conversations') then
    drop policy "Owner or group members can insert" on public.conversations;
  end if;
  if exists (select 1 from pg_policies where policyname = 'Members can read group messages' and tablename = 'messages') then
    drop policy "Members can read group messages" on public.messages;
  end if;
  if exists (select 1 from pg_policies where policyname = 'Members can insert group messages' and tablename = 'messages') then
    drop policy "Members can insert group messages" on public.messages;
  end if;
end;
$$;

-- =============================================
-- POLICIES (no recursion, using security definer function)
-- =============================================
-- group_chats
create policy "Anyone can create a group" on public.group_chats for insert to authenticated
with
  check (true);

create policy "Members can read their groups" on public.group_chats for
select
  to authenticated using (
    created_by = auth.uid ()
    or public.is_member_of_group (id)
  );

-- group_members
create policy "Members can see member list" on public.group_members for
select
  to authenticated using (public.is_member_of_group (group_id));

create policy "Anyone can join a group" on public.group_members for insert to authenticated
with
  check (true);

-- conversations (group‑aware)
create policy "Group members can read conversation" on public.conversations for
select
  to authenticated using (
    user_id = auth.uid ()
    or (
      group_id is not null
      and public.is_member_of_group (group_id)
    )
  );

create policy "Group members can insert conversation" on public.conversations for insert to authenticated
with
  check (
    user_id = auth.uid ()
    or (
      group_id is not null
      and public.is_member_of_group (group_id)
    )
  );

-- messages (group‑aware)
create policy "Group members can read messages" on public.messages for
select
  to authenticated using (
    conversation_id in (
      select
        id
      from
        public.conversations
      where
        user_id = auth.uid ()
        or (
          group_id is not null
          and public.is_member_of_group (group_id)
        )
    )
  );

create policy "Group members can insert messages" on public.messages for insert to authenticated
with
  check (
    conversation_id in (
      select
        id
      from
        public.conversations
      where
        user_id = auth.uid ()
        or (
          group_id is not null
          and public.is_member_of_group (group_id)
        )
    )
  );



select * from
(select count(pid) as active_connections FROM pg_stat_activity where state = 'active') active_connections,
(select setting as max_connections from pg_settings where name = 'max_connections') max_connections;



select tablename, policyname, cmd, qual, with_check
from pg_policies
where tablename in ('group_chats','group_members','conversations','messages');



create or replace function public.admin_list_users(p_admin_email text)
returns table (id uuid, email text, created_at timestamptz)
language plpgsql
security definer
as $$
begin
  if exists (select 1 from auth.users where id = auth.uid() and email = p_admin_email) then
    return query select au.id, au.email, au.created_at from auth.users au order by au.created_at desc;
  end if;
end;
$$;



alter table public.profiles add column if not exists persona text;


create table if not exists public.retrieval_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  query text not null,
  rewritten_queries text[],
  urls_used text[],
  sources_used text[],
  answer text,
  created_at timestamp with time zone default now()
);

alter table public.retrieval_logs enable row level security;

create policy "Users can read own retrieval logs"
on public.retrieval_logs for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own retrieval logs"
on public.retrieval_logs for insert
to authenticated
with check (user_id = auth.uid());



alter table public.memories add column if not exists embedding vector(768);
create index if not exists memories_embedding_idx on public.memories using ivfflat (embedding vector_cosine_ops) with (lists = 100);
alter function public.match_memories security definer;



create index if not exists messages_conv_created_idx on public.messages (conversation_id, created_at);
create index if not exists conversations_user_idx on public.conversations (user_id, created_at);
create index if not exists memories_user_created_idx on public.memories (user_id, created_at);
alter role authenticator set statement_timeout = '10s';



create table if not exists public.ide_token_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  tokens_used int default 0,
  reset_at timestamptz default now()
);

alter table public.ide_token_usage enable row level security;

create policy "Users can read own IDE usage"
on public.ide_token_usage
for select
to authenticated
using (user_id = auth.uid());

-- Allow upsert (increment) via a function or trusted backend only
-- We'll use a security definer function for increment



create or replace function public.ide_increment_token_usage(
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
  -- Get or create usage row for today
  insert into public.ide_token_usage (user_id, tokens_used, reset_at)
  values (p_user_id, 0, now())
  on conflict (user_id) do nothing;

  -- Check if reset needed (24h)
  update public.ide_token_usage
  set tokens_used = 0,
      reset_at = now()
  where user_id = p_user_id
    and now() - reset_at > interval '24 hours';

  -- Try to increment
  update public.ide_token_usage
  set tokens_used = tokens_used + p_tokens
  where user_id = p_user_id
    and tokens_used + p_tokens <= p_limit;

  -- Return true if update affected a row (limit not exceeded)
  return found;
end;
$$;


create table if not exists public.ide_files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  path text not null,
  content text not null default '',
  updated_at timestamptz default now(),
  unique (user_id, path)
);

alter table public.ide_files enable row level security;

drop policy if exists "Users can read own ide files" on public.ide_files;
create policy "Users can read own ide files"
on public.ide_files for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own ide files" on public.ide_files;
create policy "Users can insert own ide files"
on public.ide_files for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own ide files" on public.ide_files;
create policy "Users can update own ide files"
on public.ide_files for update
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can delete own ide files" on public.ide_files;
create policy "Users can delete own ide files"
on public.ide_files for delete
to authenticated
using (user_id = auth.uid());


-- Add request count column if missing
alter table public.ide_token_usage
add column if not exists requests_count int default 0;

-- Add reset_at column if missing (it should already exist, but just in case)
alter table public.ide_token_usage
add column if not exists reset_at timestamptz default now();

-- Ensure RLS allows user to read/write own row
drop policy if exists "Users can read own IDE usage" on public.ide_token_usage;
create policy "Users can read own IDE usage"
on public.ide_token_usage for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own IDE usage" on public.ide_token_usage;
create policy "Users can insert own IDE usage"
on public.ide_token_usage for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own IDE usage" on public.ide_token_usage;
create policy "Users can update own IDE usage"
on public.ide_token_usage for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());


-- Table for IDE file chunks
create table if not exists public.ide_file_chunks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  path text not null,
  content text not null,          -- the chunk text
  embedding vector(768) not null,
  chunk_index int not null,       -- order within the file
  updated_at timestamptz default now()
);

-- Index for similarity search
create index if not exists ide_file_chunks_embedding_idx
on public.ide_file_chunks
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Allow user to manage own chunks
alter table public.ide_file_chunks enable row level security;

drop policy if exists "Users can read own ide chunks" on public.ide_file_chunks;
create policy "Users can read own ide chunks"
on public.ide_file_chunks for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own ide chunks" on public.ide_file_chunks;
create policy "Users can insert own ide chunks"
on public.ide_file_chunks for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can delete own ide chunks" on public.ide_file_chunks;
create policy "Users can delete own ide chunks"
on public.ide_file_chunks for delete
to authenticated
using (user_id = auth.uid());


alter table public.ide_file_chunks
add column if not exists metadata jsonb default '{}';

create or replace function public.match_ide_chunks(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
returns table (
  path text,
  content text,
  similarity float,
  metadata jsonb
)
language sql
stable
as $$
  select
    ide_file_chunks.path,
    ide_file_chunks.content,
    1 - (ide_file_chunks.embedding <=> query_embedding) as similarity,
    coalesce(ide_file_chunks.metadata, '{}'::jsonb) as metadata
  from public.ide_file_chunks
  where ide_file_chunks.user_id = p_user_id
    and 1 - (ide_file_chunks.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;


-- Create chat_summaries table for context compression
CREATE TABLE IF NOT EXISTS chat_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  summary JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chat_summaries_conversation_id ON chat_summaries(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_summaries_created_at ON chat_summaries(created_at DESC);

-- Add RLS policies
ALTER TABLE chat_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat summaries"
  ON chat_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = chat_summaries.conversation_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own chat summaries"
  ON chat_summaries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = chat_summaries.conversation_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own chat summaries"
  ON chat_summaries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = chat_summaries.conversation_id
        AND user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_chat_summaries_updated_at_trigger ON chat_summaries;
CREATE TRIGGER update_chat_summaries_updated_at_trigger
  BEFORE UPDATE ON chat_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_summaries_updated_at();


-- Create project_memory table for persistent project memory
CREATE TABLE IF NOT EXISTS project_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  memory JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_memory_user_project ON project_memory(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_project_memory_updated_at ON project_memory(updated_at DESC);

-- Add RLS policies
ALTER TABLE project_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own project memory"
  ON project_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project memory"
  ON project_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project memory"
  ON project_memory FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project memory"
  ON project_memory FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_project_memory_updated_at_trigger
  BEFORE UPDATE ON project_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_project_memory_updated_at();


CREATE TABLE IF NOT EXISTS public.user_folder_structure (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  structure TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_folder_structure ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own folder structure"
  ON public.user_folder_structure FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own folder structure"
  ON public.user_folder_structure FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folder structure"
  ON public.user_folder_structure FOR UPDATE
  USING (auth.uid() = user_id);


CREATE OR REPLACE FUNCTION reset_daily_tokens()
RETURNS void AS $$
BEGIN
  UPDATE public.ide_token_usage
  SET tokens_used = 0, reset_at = NOW()
  WHERE NOW() - reset_at > INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;



-- 1. Add user_id column (if you haven't already)
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() NOT NULL;

-- 3. Create the SELECT policy
CREATE POLICY "Enable select for users based on user_id"
ON public.messages
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);



CREATE TABLE IF NOT EXISTS public.chat_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_tier text NOT NULL,
  messages_used int NOT NULL DEFAULT 0,
  reset_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  PRIMARY KEY (user_id, model_tier)
);

ALTER TABLE public.chat_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage"
ON public.chat_usage
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);



-- Allow authenticated users to insert their own usage record
CREATE POLICY "Users can insert own usage"
ON public.chat_usage
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own usage record
CREATE POLICY "Users can update own usage"
ON public.chat_usage
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  warmth int DEFAULT 0 CHECK (warmth >= -1 AND warmth <= 1),
  enthusiasm int DEFAULT 0 CHECK (enthusiasm >= -1 AND enthusiasm <= 1),
  formatting int DEFAULT 0 CHECK (formatting >= -1 AND formatting <= 1),
  conciseness int DEFAULT 0 CHECK (conciseness >= -1 AND warmth <= 1),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
ON public.user_preferences
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
ON public.user_preferences
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON public.user_preferences
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);



DROP TABLE IF EXISTS public.user_topics CASCADE;



CREATE TABLE IF NOT EXISTS public.bot_persona_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, note)
);

ALTER TABLE public.bot_persona_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own persona notes"
ON public.bot_persona_notes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own persona notes"
ON public.bot_persona_notes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);


DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Get the user UUID from their email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'onik20102010@gmail.com';

  -- Only proceed if the user exists
  IF target_user_id IS NOT NULL THEN
    -- Insert a bypass row for each model tier
    INSERT INTO public.chat_usage (user_id, model_tier, messages_used, reset_at)
    VALUES
      (target_user_id, 'fast', -10000, '2099-01-01'::timestamptz),
      (target_user_id, 'plus', -10000, '2099-01-01'::timestamptz),
      (target_user_id, 'pro',  -10000, '2099-01-01'::timestamptz),
      (target_user_id, 'code', -10000, '2099-01-01'::timestamptz),
      (target_user_id, 'live', -10000, '2099-01-01'::timestamptz),
      (target_user_id, 'aai',  -10000, '2099-01-01'::timestamptz),
      (target_user_id, 'web_search', -10000, '2099-01-01'::timestamptz)
    ON CONFLICT (user_id, model_tier) DO UPDATE
    SET messages_used = -10000,
        reset_at = '2099-01-01'::timestamptz;
  END IF;
END;
$$;
