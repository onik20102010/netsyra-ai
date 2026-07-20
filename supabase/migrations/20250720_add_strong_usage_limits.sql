-- Add strong usage limits with database-level enforcement
-- This migration adds atomic functions and constraints for message limits

-- Ensure chat schema exists
create schema if not exists chat;

-- Grant permissions
grant usage on schema chat to anon, authenticated;
grant all on all tables in schema chat to authenticated;
grant all on all sequences in schema chat to authenticated;
grant all on all functions in schema chat to authenticated;

-- Ensure chat_usage table exists
create table if not exists chat.chat_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  model_tier text not null,
  messages_used int not null default 0,
  reset_at timestamptz not null default (now() + interval '24 hours'),
  primary key (user_id, model_tier)
);

-- Enable RLS on chat_usage
alter table chat.chat_usage enable row level security;

-- RLS policies for chat_usage
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

-- Create index for performance
create index if not exists idx_chat_usage_user_tier on chat.chat_usage(user_id, model_tier);

-- Create atomic increment function for chat usage
create or replace function chat.increment_chat_usage(
  p_user_id uuid,
  p_model_tier text
)
returns int
language plpgsql
security definer
as $$
declare
  v_current_count int;
  v_reset_at timestamptz;
  v_now timestamptz := now();
  v_limit int;
begin
  -- Define limits based on model tier (TESTING: all set to 2)
  v_limit := case p_model_tier
    when 'fast' then 2
    when 'plus' then 2
    when 'pro' then 2
    when 'code' then 2
    when 'live' then 2
    when 'aai' then 2
    when 'group' then 2
    when 'web_search' then 2
    else 2
  end;

  -- Get current usage or create new record
  select messages_used, reset_at into v_current_count, v_reset_at
  from chat.chat_usage
  where user_id = p_user_id and model_tier = p_model_tier
  for update;

  -- Reset if expired or doesn't exist
  if v_current_count is null or v_reset_at < v_now then
    insert into chat.chat_usage (user_id, model_tier, messages_used, reset_at)
    values (p_user_id, p_model_tier, 1, v_now + interval '24 hours')
    on conflict (user_id, model_tier) do update set
      messages_used = 1,
      reset_at = v_now + interval '24 hours';
    
    return 1;
  end if;

  -- Check limit
  if v_current_count >= v_limit then
    raise exception 'Message limit exceeded for tier %', p_model_tier;
  end if;

  -- Increment atomically
  update chat.chat_usage
  set messages_used = messages_used + 1
  where user_id = p_user_id and model_tier = p_model_tier;

  return v_current_count + 1;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function chat.increment_chat_usage to authenticated;

-- Add check constraint to ensure messages_used never goes negative
alter table chat.chat_usage 
drop constraint if exists check_messages_used_non_negative;
alter table chat.chat_usage 
add constraint check_messages_used_non_negative 
check (messages_used >= 0);

-- Add check constraint to ensure reset_at is in the future
alter table chat.chat_usage 
drop constraint if exists check_reset_at_future;
alter table chat.chat_usage 
add constraint check_reset_at_future 
check (reset_at > now());

-- Create function to get current usage status
create or replace function chat.get_usage_status(
  p_user_id uuid,
  p_model_tier text
)
returns table (
  messages_used int,
  messages_limit int,
  remaining int,
  reset_at timestamptz,
  is_reset_needed boolean
)
language plpgsql
security definer
as $$
declare
  v_limit int;
  v_now timestamptz := now();
begin
  -- Define limits based on model tier (TESTING: all set to 2)
  v_limit := case p_model_tier
    when 'fast' then 2
    when 'plus' then 2
    when 'pro' then 2
    when 'code' then 2
    when 'live' then 2
    when 'aai' then 2
    when 'group' then 2
    when 'web_search' then 2
    else 2
  end;

  return query
  select 
    coalesce(cu.messages_used, 0) as messages_used,
    v_limit as messages_limit,
    greatest(0, v_limit - coalesce(cu.messages_used, 0)) as remaining,
    coalesce(cu.reset_at, v_now + interval '24 hours') as reset_at,
    (cu.reset_at is null or cu.reset_at < v_now) as is_reset_needed
  from chat.chat_usage cu
  where cu.user_id = p_user_id and cu.model_tier = p_model_tier;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function chat.get_usage_status to authenticated;

-- Create trigger to auto-reset expired usage records
create or replace function chat.auto_reset_expired_usage()
returns trigger
language plpgsql
as $$
begin
  if new.reset_at < now() then
    new.messages_used := 0;
    new.reset_at := now() + interval '24 hours';
  end if;
  return new;
end;
$$;

-- Add trigger to chat_usage table
drop trigger if exists trigger_auto_reset_expired_usage on chat.chat_usage;
create trigger trigger_auto_reset_expired_usage
  before insert or update on chat.chat_usage
  for each row
  execute function chat.auto_reset_expired_usage();

-- Add index for performance on reset_at
create index if not exists idx_chat_usage_reset_at on chat.chat_usage(reset_at);

-- Add comment to document the limits (TESTING: all set to 2)
comment on column chat.chat_usage.model_tier is 'Model tier: fast(2), plus(2), pro(2), code(2), live(2), aai(2), group(2), web_search(2) messages per 24 hours (TESTING)';
comment on function chat.increment_chat_usage is 'Atomically increments chat usage with limit enforcement and auto-reset';
comment on function chat.get_usage_status is 'Returns current usage status including remaining messages and reset time';
