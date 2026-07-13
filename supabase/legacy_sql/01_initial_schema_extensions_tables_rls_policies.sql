-- 1. Extensions

create extension if not exists vector with schema extensions;



-- 2. Tables

create table if not exists public.profiles (

  id uuid default gen_random_uuid() primary key,

  user_id uuid references auth.users not null unique,

  name text,

  created_at timestamp with time zone default now()

);



create table if not exists public.conversations (

  id uuid default gen_random_uuid() primary key,

  user_id uuid references auth.users not null,

  title text,

  created_at timestamp with time zone default now()

);



create table if not exists public.messages (

  id uuid default gen_random_uuid() primary key,

  conversation_id uuid references public.conversations on delete cascade not null,

  role text not null check (role in ('user', 'assistant', 'system')),

  content text not null,

  created_at timestamp with time zone default now()

);



create table if not exists public.memories (

  id uuid default gen_random_uuid() primary key,

  user_id uuid references auth.users not null,

  content text not null,

  memory_type text default 'fact',

  importance_score real not null default 0.5,

  embedding vector(768),

  created_at timestamp with time zone default now()

);



-- 3. Add profile message tracking columns

alter table public.profiles

add column if not exists message_count int default 0,

add column if not exists message_reset_at timestamptz default now();



-- 4. Add per‑conversation message limit tracking columns

alter table public.conversations

add column if not exists message_count int default 0,

add column if not exists message_reset_at timestamptz default now();



-- 5. Index for similarity search

create index if not exists memories_embedding_idx

on public.memories

using ivfflat (embedding vector_cosine_ops)

with (lists = 100);



-- 6. match_memories function

create or replace function public.match_memories(

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

as $$

  select

    memories.id,

    memories.content,

    1 - (memories.embedding <=> query_embedding) as similarity

  from public.memories

  where memories.user_id = p_user_id

    and 1 - (memories.embedding <=> query_embedding) > match_threshold

  order by similarity desc

  limit match_count;

$$;



-- 7. Enable RLS

alter table public.profiles enable row level security;

alter table public.conversations enable row level security;

alter table public.messages enable row level security;

alter table public.memories enable row level security;



-- 8. Drop old policies safely

do $$

begin



  -- profiles

  if exists (

    select 1 from pg_policies

    where policyname = 'Users can read own profile'

    and tablename = 'profiles'

  ) then

    drop policy "Users can read own profile"

    on public.profiles;

  end if;



  if exists (

    select 1 from pg_policies

    where policyname = 'Users can update own profile'

    and tablename = 'profiles'

  ) then

    drop policy "Users can update own profile"

    on public.profiles;

  end if;



  if exists (

    select 1 from pg_policies

    where policyname = 'Users can insert own profile'

    and tablename = 'profiles'

  ) then

    drop policy "Users can insert own profile"

    on public.profiles;

  end if;



  -- conversations

  if exists (

    select 1 from pg_policies

    where policyname = 'Users can read own conversations'

    and tablename = 'conversations'

  ) then

    drop policy "Users can read own conversations"

    on public.conversations;

  end if;



  if exists (

    select 1 from pg_policies

    where policyname = 'Users can insert own conversations'

    and tablename = 'conversations'

  ) then

    drop policy "Users can insert own conversations"

    on public.conversations;

  end if;



  if exists (

    select 1 from pg_policies

    where policyname = 'Users can delete own conversations'

    and tablename = 'conversations'

  ) then

    drop policy "Users can delete own conversations"

    on public.conversations;

  end if;



  if exists (

    select 1 from pg_policies

    where policyname = 'Users can update own conversations'

    and tablename = 'conversations'

  ) then

    drop policy "Users can update own conversations"

    on public.conversations;

  end if;



  -- messages

  if exists (

    select 1 from pg_policies

    where policyname = 'Users can read messages of own conversations'

    and tablename = 'messages'

  ) then

    drop policy "Users can read messages of own conversations"

    on public.messages;

  end if;



  if exists (

    select 1 from pg_policies

    where policyname = 'Users can insert messages in own conversations'

    and tablename = 'messages'

  ) then

    drop policy "Users can insert messages in own conversations"

    on public.messages;

  end if;



  -- memories

  if exists (

    select 1 from pg_policies

    where policyname = 'Users can read own memories'

    and tablename = 'memories'

  ) then

    drop policy "Users can read own memories"

    on public.memories;

  end if;



  if exists (

    select 1 from pg_policies

    where policyname = 'Users can insert own memories'

    and tablename = 'memories'

  ) then

    drop policy "Users can insert own memories"

    on public.memories;

  end if;



end;

$$;



-- 9. Create policies (with missing SELECT added)



-- profiles (SELECT, INSERT, UPDATE)

create policy "Users can read own profile"

on public.profiles

for select

to authenticated

using (user_id = auth.uid());



create policy "Users can update own profile"

on public.profiles

for update

to authenticated

using (user_id = auth.uid())

with check (user_id = auth.uid());



create policy "Users can insert own profile"

on public.profiles

for insert

to authenticated

with check (user_id = auth.uid());



-- conversations

create policy "Users can read own conversations"

on public.conversations

for select

to authenticated

using (user_id = auth.uid());



create policy "Users can insert own conversations"

on public.conversations

for insert

to authenticated

with check (user_id = auth.uid());



create policy "Users can delete own conversations"

on public.conversations

for delete

to authenticated

using (user_id = auth.uid());



create policy "Users can update own conversations"

on public.conversations

for update

to authenticated

using (user_id = auth.uid())

with check (user_id = auth.uid());



-- messages

create policy "Users can read messages of own conversations"

on public.messages

for select

to authenticated

using (

  conversation_id in (

    select id

    from public.conversations

    where user_id = auth.uid()

  )

);



create policy "Users can insert messages in own conversations"

on public.messages

for insert

to authenticated

with check (

  conversation_id in (

    select id

    from public.conversations

    where user_id = auth.uid()

  )

);



-- memories

create policy "Users can read own memories"

on public.memories

for select

to authenticated

using (user_id = auth.uid());



create policy "Users can insert own memories"

on public.memories

for insert

to authenticated

with check (user_id = auth.uid());



-- 10. Allow function to bypass RLS

alter function public.match_memories

security definer;
