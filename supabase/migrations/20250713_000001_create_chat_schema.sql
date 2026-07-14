-- Separate chat schema for Netsyra Chat
-- All chat history, group chats, usage, preferences, and chat memory live here.
-- The IDE does NOT use this schema.

create schema if not exists chat;

grant usage on schema chat to anon, authenticated;
grant all on all tables in schema chat to authenticated;
grant all on all sequences in schema chat to authenticated;
grant all on all functions in schema chat to authenticated;

-- Enable pgvector extension for memory embedding (already in extensions schema)
create extension if not exists vector with schema extensions;

-- =============================================
-- CORE CHAT TABLES
-- =============================================

create table if not exists chat.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text,
  folder text default '',
  pinned boolean default false,
  archived boolean default false,
  group_id uuid references chat.group_chats on delete cascade,
  created_at timestamp with time zone default now()
);

create table if not exists chat.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references chat.conversations on delete cascade not null,
  user_id uuid references auth.users not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamp with time zone default now()
);

-- =============================================
-- GROUP CHAT TABLES
-- =============================================

create table if not exists chat.group_chats (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  invite_code text unique not null,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default now()
);

create table if not exists chat.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references chat.group_chats on delete cascade not null,
  user_id uuid references auth.users not null,
  joined_at timestamp with time zone default now(),
  unique (group_id, user_id)
);

-- Add self-referencing group_id after tables exist
alter table chat.conversations
  add column if not exists group_id uuid references chat.group_chats on delete cascade;

-- =============================================
-- CHAT USAGE & PREFERENCES
-- =============================================

create table if not exists chat.chat_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  model_tier text not null,
  messages_used int not null default 0,
  reset_at timestamptz not null default (now() + interval '24 hours'),
  primary key (user_id, model_tier)
);

create table if not exists chat.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  warmth int default 0 check (warmth >= -1 and warmth <= 1),
  enthusiasm int default 0 check (enthusiasm >= -1 and enthusiasm <= 1),
  formatting int default 0 check (formatting >= -1 and formatting <= 1),
  conciseness int default 0 check (conciseness >= -1 and conciseness <= 1),
  updated_at timestamptz default now()
);

create table if not exists chat.user_model_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  model_id text not null,
  tokens_used int default 0,
  messages_sent int default 0,
  reset_at timestamptz default now(),
  unique (user_id, model_id)
);

create table if not exists chat.bot_persona_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now(),
  unique (user_id, note)
);

-- =============================================
-- CHAT MEMORY / SUMMARY TABLES
-- =============================================

create table if not exists chat.chat_summaries (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid not null references chat.conversations(id) on delete cascade,
  summary jsonb not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists chat.memories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  content text not null,
  memory_type text default 'fact',
  importance_score real not null default 0.5,
  embedding vector(768),
  created_at timestamp with time zone default now()
);

create table if not exists chat.episodic_memories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  user_message text not null,
  assistant_reply text not null,
  created_at timestamp with time zone default now()
);

create table if not exists chat.retrieval_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  query text not null,
  rewritten_queries text[] default '{}',
  urls_used text[] default '{}',
  sources_used text[] default '{}',
  answer text,
  created_at timestamp with time zone default now()
);

-- =============================================
-- INDEXES
-- =============================================

create index if not exists idx_conversations_user_created on chat.conversations (user_id, created_at);
create index if not exists idx_conversations_group on chat.conversations (group_id);
create index if not exists idx_messages_conv_created on chat.messages (conversation_id, created_at);
create index if not exists idx_messages_user on chat.messages (user_id);
create index if not exists idx_group_members_group on chat.group_members (group_id);
create index if not exists idx_group_members_user on chat.group_members (user_id);
create index if not exists idx_chat_usage_user_tier on chat.chat_usage (user_id, model_tier);
create index if not exists idx_user_model_usage_user_model on chat.user_model_usage (user_id, model_id);
create index if not exists idx_chat_summaries_conversation_id on chat.chat_summaries (conversation_id);
create index if not exists idx_chat_summaries_created_at on chat.chat_summaries (created_at desc);
create index if not exists idx_memories_user_created on chat.memories (user_id, created_at);
create index if not exists idx_memories_embedding on chat.memories using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists idx_episodic_memories_user_created on chat.episodic_memories (user_id, created_at);
create index if not exists idx_retrieval_logs_user_created on chat.retrieval_logs (user_id, created_at);

-- =============================================
-- SECURITY DEFINER HELPERS
-- =============================================

create or replace function chat.is_member_of_group(p_group_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from chat.group_members
    where group_id = p_group_id
      and user_id = auth.uid()
  );
$$;

create or replace function chat.lookup_group_by_code(p_code text)
returns table (
  id uuid,
  name text,
  invite_code text,
  created_by uuid
)
language sql
security definer
as $$
  select id, name, invite_code, created_by
  from chat.group_chats
  where invite_code = p_code
  limit 1;
$$;

create or replace function chat.match_memories(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
returns table (
  id uuid,
  content text,
  similarity float
)
language sql
stable
security definer
as $$
  select
    memories.id,
    memories.content,
    1 - (memories.embedding <=> query_embedding) as similarity
  from chat.memories
  where memories.user_id = p_user_id
    and 1 - (memories.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

create or replace function chat.update_chat_summaries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_chat_summaries_updated_at_trigger on chat.chat_summaries;
create trigger update_chat_summaries_updated_at_trigger
  before update on chat.chat_summaries
  for each row
  execute function chat.update_chat_summaries_updated_at();

-- =============================================
-- ENABLE RLS
-- =============================================

alter table chat.conversations enable row level security;
alter table chat.messages enable row level security;
alter table chat.group_chats enable row level security;
alter table chat.group_members enable row level security;
alter table chat.chat_usage enable row level security;
alter table chat.user_preferences enable row level security;
alter table chat.user_model_usage enable row level security;
alter table chat.bot_persona_notes enable row level security;
alter table chat.chat_summaries enable row level security;
alter table chat.memories enable row level security;
alter table chat.episodic_memories enable row level security;
alter table chat.retrieval_logs enable row level security;

-- =============================================
-- RLS POLICIES
-- =============================================

-- group_chats
create policy "Anyone can create a group"
  on chat.group_chats for insert to authenticated
  with check (true);

create policy "Members can read their groups"
  on chat.group_chats for select to authenticated
  using (
    created_by = auth.uid()
    or chat.is_member_of_group(id)
  );

-- group_members
create policy "Members can see member list"
  on chat.group_members for select to authenticated
  using (chat.is_member_of_group(group_id));

create policy "Anyone can join a group"
  on chat.group_members for insert to authenticated
  with check (true);

-- conversations
create policy "Group members can read conversation"
  on chat.conversations for select to authenticated
  using (
    user_id = auth.uid()
    or (
      group_id is not null
      and chat.is_member_of_group(group_id)
    )
  );

create policy "Group members can insert conversation"
  on chat.conversations for insert to authenticated
  with check (
    user_id = auth.uid()
    or (
      group_id is not null
      and chat.is_member_of_group(group_id)
    )
  );

create policy "Group members can update conversation"
  on chat.conversations for update to authenticated
  using (
    user_id = auth.uid()
    or (
      group_id is not null
      and chat.is_member_of_group(group_id)
    )
  )
  with check (
    user_id = auth.uid()
    or (
      group_id is not null
      and chat.is_member_of_group(group_id)
    )
  );

create policy "Group members can delete conversation"
  on chat.conversations for delete to authenticated
  using (
    user_id = auth.uid()
    or (
      group_id is not null
      and chat.is_member_of_group(group_id)
    )
  );

-- messages
create policy "Group members can read messages"
  on chat.messages for select to authenticated
  using (
    conversation_id in (
      select id
      from chat.conversations
      where user_id = auth.uid()
        or (
          group_id is not null
          and chat.is_member_of_group(group_id)
        )
    )
  );

create policy "Group members can insert messages"
  on chat.messages for insert to authenticated
  with check (
    conversation_id in (
      select id
      from chat.conversations
      where user_id = auth.uid()
        or (
          group_id is not null
          and chat.is_member_of_group(group_id)
        )
    )
  );

-- chat_usage
create policy "Users can read own chat usage"
  on chat.chat_usage for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own chat usage"
  on chat.chat_usage for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own chat usage"
  on chat.chat_usage for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- user_preferences
create policy "Users can read own preferences"
  on chat.user_preferences for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own preferences"
  on chat.user_preferences for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own preferences"
  on chat.user_preferences for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- user_model_usage
create policy "Users can read own model usage"
  on chat.user_model_usage for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own model usage"
  on chat.user_model_usage for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own model usage"
  on chat.user_model_usage for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- bot_persona_notes
create policy "Users can read own persona notes"
  on chat.bot_persona_notes for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own persona notes"
  on chat.bot_persona_notes for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own persona notes"
  on chat.bot_persona_notes for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own persona notes"
  on chat.bot_persona_notes for delete to authenticated
  using (user_id = auth.uid());

-- chat_summaries
create policy "Users can view their own chat summaries"
  on chat.chat_summaries for select to authenticated
  using (
    exists (
      select 1 from chat.conversations
      where id = chat_summaries.conversation_id
        and (
          user_id = auth.uid()
          or (
            group_id is not null
            and chat.is_member_of_group(group_id)
          )
        )
    )
  );

create policy "Users can insert their own chat summaries"
  on chat.chat_summaries for insert to authenticated
  with check (
    exists (
      select 1 from chat.conversations
      where id = chat_summaries.conversation_id
        and (
          user_id = auth.uid()
          or (
            group_id is not null
            and chat.is_member_of_group(group_id)
          )
        )
    )
  );

create policy "Users can update their own chat summaries"
  on chat.chat_summaries for update to authenticated
  using (
    exists (
      select 1 from chat.conversations
      where id = chat_summaries.conversation_id
        and (
          user_id = auth.uid()
          or (
            group_id is not null
            and chat.is_member_of_group(group_id)
          )
        )
    )
  );

-- memories, episodic memories, retrieval logs
create policy "Users can read own memories"
  on chat.memories for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own memories"
  on chat.memories for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can read own episodic memories"
  on chat.episodic_memories for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own episodic memories"
  on chat.episodic_memories for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can read own retrieval logs"
  on chat.retrieval_logs for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own retrieval logs"
  on chat.retrieval_logs for insert to authenticated
  with check (user_id = auth.uid());
