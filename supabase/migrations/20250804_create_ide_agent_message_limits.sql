-- IDE Agent Message Limits
-- Enforces a hard limit of 3 user messages per 24 hours to the IDE agent.
-- This counts USER MESSAGES (not LLM API calls), so one agent run with
-- 20 tool rounds still counts as 1 message.

-- Ensure schema exists (safe if already created by prior migration)
create schema if not exists ide;

grant usage on schema ide to anon, authenticated;
grant all on all tables in schema ide to authenticated;
grant all on all sequences in schema ide to authenticated;
grant all on all functions in schema ide to authenticated;

-- =============================================
-- TABLE
-- =============================================

create table if not exists ide.agent_message_limits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade unique,
  messages_sent int not null default 0,
  window_start timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast lookups
create index if not exists idx_agent_message_limits_user
  on ide.agent_message_limits (user_id);

-- =============================================
-- RLS
-- =============================================

alter table ide.agent_message_limits enable row level security;

drop policy if exists "Users can read own agent message limits" on ide.agent_message_limits;
drop policy if exists "Users can insert own agent message limits" on ide.agent_message_limits;
drop policy if exists "Users can update own agent message limits" on ide.agent_message_limits;

create policy "Users can read own agent message limits"
  on ide.agent_message_limits for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own agent message limits"
  on ide.agent_message_limits for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own agent message limits"
  on ide.agent_message_limits for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =============================================
-- SECURITY DEFINER FUNCTIONS
-- =============================================

-- Function: check_and_increment_agent_message
-- Atomically checks if the user can send a message, and if so, increments the counter.
-- Returns: remaining messages after increment, or -1 if limit exceeded.
create or replace function ide.check_and_increment_agent_message(
  p_user_id uuid,
  p_limit int default 3,
  p_window_hours int default 24
) returns int
language plpgsql
security definer
as $$
declare
  v_record record;
  v_remaining int;
begin
  -- Lock the row for this user (or create it)
  select * into v_record
  from ide.agent_message_limits
  where user_id = p_user_id
  for update;

  -- If no record exists, create one
  if not found then
    insert into ide.agent_message_limits (user_id, messages_sent, window_start)
    values (p_user_id, 0, now())
    returning * into v_record;
  end if;

  -- Check if window has expired, reset if so
  if v_record.window_start < now() - (p_window_hours || ' hours')::interval then
    update ide.agent_message_limits
    set messages_sent = 0,
        window_start = now(),
        updated_at = now()
    where id = v_record.id
    returning * into v_record;
  end if;

  -- Check if limit reached
  if v_record.messages_sent >= p_limit then
    return -1; -- Limit exceeded
  end if;

  -- Increment counter
  update ide.agent_message_limits
  set messages_sent = messages_sent + 1,
      updated_at = now()
  where id = v_record.id
  returning messages_sent into v_remaining;

  -- Return remaining messages
  return p_limit - v_remaining;
end;
$$;

-- Function: get_agent_message_limit_status
-- Returns current usage info without incrementing
create or replace function ide.get_agent_message_limit_status(
  p_user_id uuid,
  p_limit int default 3,
  p_window_hours int default 24
) returns table (
  messages_sent int,
  remaining int,
  window_start timestamptz,
  window_end timestamptz,
  reset_in_seconds int
)
language plpgsql
security definer
as $$
declare
  v_record record;
  v_window_end timestamptz;
  v_reset_seconds int;
begin
  -- Get current record
  select * into v_record
  from ide.agent_message_limits
  where user_id = p_user_id;

  -- If no record, user hasn't sent any messages
  if not found then
    v_window_end := now() + (p_window_hours || ' hours')::interval;
    v_reset_seconds := p_window_hours * 3600;
    return query select 0, p_limit, now(), v_window_end, v_reset_seconds;
  end if;

  -- Check if window expired
  if v_record.window_start < now() - (p_window_hours || ' hours')::interval then
    v_window_end := now() + (p_window_hours || ' hours')::interval;
    v_reset_seconds := p_window_hours * 3600;
    return query select 0, p_limit, now(), v_window_end, v_reset_seconds;
  end if;

  -- Calculate window end and reset time
  v_window_end := v_record.window_start + (p_window_hours || ' hours')::interval;
  v_reset_seconds := extract(epoch from (v_window_end - now()))::int;

  -- Return current status
  return query select 
    v_record.messages_sent, 
    p_limit - v_record.messages_sent, 
    v_record.window_start, 
    v_window_end, 
    v_reset_seconds;
end;
$$;

-- Grant execute permissions to authenticated users
grant execute on function ide.check_and_increment_agent_message to authenticated;
grant execute on function ide.get_agent_message_limit_status to authenticated;
