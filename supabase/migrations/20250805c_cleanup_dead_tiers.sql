-- ============================================================
-- Remove dead 'group' and 'web_search' tiers from chat_usage
-- functions and comments. These tiers don't exist in the model
-- registry or router config — they were leftover from an old
-- group chat feature that was never implemented.
-- ============================================================

-- 1. Update increment_chat_usage function (remove group/web_search cases)
create or replace function chat.increment_chat_usage(
  p_user_id uuid,
  p_model_tier text
) returns integer
language plpgsql
security definer
as $$
declare
  v_limit integer;
  v_current_count integer;
  v_reset_at timestamptz;
  v_new_count integer;
  v_now timestamptz := now();
begin
  -- Define limits based on model tier
  v_limit := case p_model_tier
    when 'fast' then 15
    when 'plus' then 10
    when 'pro' then 5
    when 'code' then 5
    when 'live' then 5
    when 'aai' then 5
    else 10
  end;

  -- Get current usage or create new record
  select messages_used, reset_at into v_current_count, v_reset_at
  from chat.chat_usage
  where user_id = p_user_id and model_tier = p_model_tier
  for update;

  -- Reset if needed
  if v_reset_at is null or v_reset_at < v_now then
    v_current_count := 0;
    v_reset_at := v_now + interval '24 hours';
  end if;

  -- Check limit
  if v_current_count >= v_limit then
    raise exception 'Daily message limit reached for tier %', p_model_tier
      using errcode = '23001';
  end if;

  -- Increment
  v_new_count := v_current_count + 1;

  -- Upsert
  insert into chat.chat_usage (user_id, model_tier, messages_used, reset_at)
  values (p_user_id, p_model_tier, v_new_count, v_reset_at)
  on conflict (user_id, model_tier)
  do update set messages_used = v_new_count, reset_at = v_reset_at;

  return v_new_count;
end;
$$;

-- 2. Update get_usage_status function (remove group/web_search cases)
create or replace function chat.get_usage_status(
  p_user_id uuid,
  p_model_tier text
) returns table(
  messages_used integer,
  messages_limit integer,
  remaining integer,
  reset_at timestamptz,
  is_reset_needed boolean
)
language plpgsql
security definer
as $$
declare
  v_limit integer;
  v_now timestamptz := now();
begin
  -- Define limits based on model tier
  v_limit := case p_model_tier
    when 'fast' then 15
    when 'plus' then 10
    when 'pro' then 5
    when 'code' then 5
    when 'live' then 5
    when 'aai' then 5
    else 10
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

-- 3. Update column comment (remove group/web_search)
comment on column chat.chat_usage.model_tier is 'Model tier: fast(15), plus(10), pro(5), code(5), live(5), aai(5) messages per 24 hours';
comment on function chat.increment_chat_usage is 'Atomically increments chat usage with limit enforcement and auto-reset';
comment on function chat.get_usage_status is 'Returns current usage status including remaining messages and reset time';

-- 4. Clean up any existing rows with dead tiers
delete from chat.chat_usage where model_tier in ('group', 'web_search');
