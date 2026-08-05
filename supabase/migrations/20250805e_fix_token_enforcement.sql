-- ============================================================
-- FIX: Token usage enforcement for Go Plus, Pro, Plus Pro
-- ============================================================
--
-- BUGS FIXED:
-- 1. Go Plus token limits were FAKE: check_token_limits and
--    increment_token_usage used `model_key = p_model_key` which
--    returns FALSE when both are NULL (SQL NULL semantics).
--    Go Plus passes model_key=NULL, so no record was ever found,
--    check always returned "allowed", and increment always
--    INSERTed new rows. Fix: use `IS NOT DISTINCT FROM` for
--    NULL-safe comparison.
--
-- 2. increment_token_usage returned STALE reset times: after a
--    daily/monthly reset, the DB was updated with new reset_at
--    (now + 1 day/month) but the RETURN used the OLD
--    v_current_record value. Fix: return the NEW reset times.
--
-- 3. check_token_limits returned EXPIRED reset_at when a reset
--    was needed: it returned v_current_record.daily_reset_at
--    (past time) instead of a future time. Fix: return
--    now + 1 day/month when reset is needed.
--
-- 4. Race condition on INSERT: two concurrent requests could
--    both see NOT FOUND and both INSERT, causing a unique
--    constraint violation. Fix: use INSERT ... ON CONFLICT.
--
-- 5. Clean up orphaned NULL model_key rows from the old buggy
--    increment function (each Go Plus request created a new row).
--    We consolidate them into a single row per user+tier.
-- ============================================================

-- ============================================================
-- 1. Fixed check_token_limits (NULL-safe + future reset_at)
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_token_limits(
  p_user_id UUID,
  p_model_tier VARCHAR(50),
  p_model_key VARCHAR(50),
  p_daily_limit BIGINT,
  p_monthly_limit BIGINT
) RETURNS JSONB AS $$
DECLARE
  v_current_record RECORD;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_daily_remaining BIGINT;
  v_monthly_remaining BIGINT;
  v_allowed BOOLEAN;
  v_daily_reset_at TIMESTAMP WITH TIME ZONE;
  v_monthly_reset_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- NULL-safe lookup: IS NOT DISTINCT FROM treats NULL = NULL as TRUE
  SELECT * INTO v_current_record
  FROM public.token_usage
  WHERE user_id = p_user_id
    AND model_tier = p_model_tier
    AND model_key IS NOT DISTINCT FROM p_model_key;

  -- If no record exists, user hasn't used any tokens yet
  IF NOT FOUND THEN
    v_daily_reset_at := v_now + INTERVAL '1 day';
    v_monthly_reset_at := v_now + INTERVAL '1 month';
    RETURN jsonb_build_object(
      'allowed', true,
      'daily_tokens_used', 0,
      'monthly_tokens_used', 0,
      'daily_remaining', p_daily_limit,
      'monthly_remaining', p_monthly_limit,
      'daily_reset_at', v_daily_reset_at,
      'monthly_reset_at', v_monthly_reset_at
    );
  END IF;

  -- Check if daily reset is needed
  IF v_current_record.daily_reset_at < v_now THEN
    v_daily_remaining := p_daily_limit;
    v_daily_reset_at := v_now + INTERVAL '1 day';
  ELSE
    v_daily_remaining := p_daily_limit - v_current_record.daily_tokens_used;
    v_daily_reset_at := v_current_record.daily_reset_at;
  END IF;

  -- Check if monthly reset is needed
  IF v_current_record.monthly_reset_at < v_now THEN
    v_monthly_remaining := p_monthly_limit;
    v_monthly_reset_at := v_now + INTERVAL '1 month';
  ELSE
    v_monthly_remaining := p_monthly_limit - v_current_record.monthly_tokens_used;
    v_monthly_reset_at := v_current_record.monthly_reset_at;
  END IF;

  -- Determine if allowed
  v_allowed := v_daily_remaining > 0 AND v_monthly_remaining > 0;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'daily_tokens_used', COALESCE(v_current_record.daily_tokens_used, 0),
    'monthly_tokens_used', COALESCE(v_current_record.monthly_tokens_used, 0),
    'daily_remaining', GREATEST(0, v_daily_remaining),
    'monthly_remaining', GREATEST(0, v_monthly_remaining),
    'daily_reset_at', v_daily_reset_at,
    'monthly_reset_at', v_monthly_reset_at
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. Fixed increment_token_usage (NULL-safe + ON CONFLICT + correct reset_at return)
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_token_usage(
  p_user_id UUID,
  p_model_tier VARCHAR(50),
  p_model_key VARCHAR(50),
  p_tokens BIGINT
) RETURNS JSONB AS $$
DECLARE
  v_current_record RECORD;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_new_daily_tokens BIGINT;
  v_new_monthly_tokens BIGINT;
  v_daily_reset_at TIMESTAMP WITH TIME ZONE;
  v_monthly_reset_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- NULL-safe lookup with row lock
  SELECT * INTO v_current_record
  FROM public.token_usage
  WHERE user_id = p_user_id
    AND model_tier = p_model_tier
    AND model_key IS NOT DISTINCT FROM p_model_key
  FOR UPDATE;

  -- If no record exists, create one (with ON CONFLICT for race safety)
  IF NOT FOUND THEN
    v_daily_reset_at := v_now + INTERVAL '1 day';
    v_monthly_reset_at := v_now + INTERVAL '1 month';

    INSERT INTO public.token_usage (
      user_id, model_tier, model_key,
      tokens_used, daily_tokens_used, monthly_tokens_used,
      daily_reset_at, monthly_reset_at
    ) VALUES (
      p_user_id, p_model_tier, p_model_key,
      p_tokens, p_tokens, p_tokens,
      v_daily_reset_at, v_monthly_reset_at
    )
    ON CONFLICT (user_id, model_tier, model_key) DO UPDATE SET
      tokens_used = token_usage.tokens_used + p_tokens,
      daily_tokens_used = token_usage.daily_tokens_used + p_tokens,
      monthly_tokens_used = token_usage.monthly_tokens_used + p_tokens,
      updated_at = v_now
    RETURNING daily_reset_at, monthly_reset_at INTO v_daily_reset_at, v_monthly_reset_at;

    RETURN jsonb_build_object(
      'success', true,
      'daily_tokens_used', p_tokens,
      'monthly_tokens_used', p_tokens,
      'daily_reset_at', v_daily_reset_at,
      'monthly_reset_at', v_monthly_reset_at
    );
  END IF;

  -- Check if daily reset is needed
  IF v_current_record.daily_reset_at < v_now THEN
    v_new_daily_tokens := p_tokens;
    v_daily_reset_at := v_now + INTERVAL '1 day';
    UPDATE public.token_usage
    SET
      daily_tokens_used = p_tokens,
      daily_reset_at = v_daily_reset_at,
      updated_at = v_now
    WHERE user_id = p_user_id
      AND model_tier = p_model_tier
      AND model_key IS NOT DISTINCT FROM p_model_key;
  ELSE
    v_new_daily_tokens := v_current_record.daily_tokens_used + p_tokens;
    v_daily_reset_at := v_current_record.daily_reset_at;
    UPDATE public.token_usage
    SET
      daily_tokens_used = v_new_daily_tokens,
      updated_at = v_now
    WHERE user_id = p_user_id
      AND model_tier = p_model_tier
      AND model_key IS NOT DISTINCT FROM p_model_key;
  END IF;

  -- Check if monthly reset is needed
  IF v_current_record.monthly_reset_at < v_now THEN
    v_new_monthly_tokens := p_tokens;
    v_monthly_reset_at := v_now + INTERVAL '1 month';
    UPDATE public.token_usage
    SET
      monthly_tokens_used = p_tokens,
      monthly_reset_at = v_monthly_reset_at,
      updated_at = v_now
    WHERE user_id = p_user_id
      AND model_tier = p_model_tier
      AND model_key IS NOT DISTINCT FROM p_model_key;
  ELSE
    v_new_monthly_tokens := v_current_record.monthly_tokens_used + p_tokens;
    v_monthly_reset_at := v_current_record.monthly_reset_at;
    UPDATE public.token_usage
    SET
      monthly_tokens_used = v_new_monthly_tokens,
      updated_at = v_now
    WHERE user_id = p_user_id
      AND model_tier = p_model_tier
      AND model_key IS NOT DISTINCT FROM p_model_key;
  END IF;

  -- Update total tokens used
  UPDATE public.token_usage
  SET
    tokens_used = tokens_used + p_tokens,
    updated_at = v_now
  WHERE user_id = p_user_id
    AND model_tier = p_model_tier
    AND model_key IS NOT DISTINCT FROM p_model_key;

  RETURN jsonb_build_object(
    'success', true,
    'daily_tokens_used', v_new_daily_tokens,
    'monthly_tokens_used', v_new_monthly_tokens,
    'daily_reset_at', v_daily_reset_at,
    'monthly_reset_at', v_monthly_reset_at
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. Clean up orphaned NULL model_key rows from the old bug
-- ============================================================
-- The old increment_token_usage created a NEW row for every Go Plus
-- request (because NULL = NULL was FALSE in the WHERE clause).
-- We consolidate all orphaned rows into a single row per
-- (user_id, model_tier) with summed tokens, then delete the rest.
--
-- Step 1: Update the oldest row (MIN id) per (user_id, model_tier)
--         with the summed totals from ALL NULL-model_key rows.
-- Step 2: Delete all OTHER NULL-model_key rows (keeping only MIN id).
-- ============================================================

-- Step 1: Consolidate totals into the oldest row
UPDATE public.token_usage AS keep
SET
  tokens_used = agg.total_tokens,
  daily_tokens_used = agg.total_daily,
  monthly_tokens_used = agg.total_monthly,
  daily_reset_at = agg.max_daily_reset,
  monthly_reset_at = agg.max_monthly_reset,
  updated_at = NOW()
FROM (
  SELECT
    user_id,
    model_tier,
    SUM(tokens_used) AS total_tokens,
    SUM(daily_tokens_used) AS total_daily,
    SUM(monthly_tokens_used) AS total_monthly,
    MAX(daily_reset_at) AS max_daily_reset,
    MAX(monthly_reset_at) AS max_monthly_reset,
    MIN(id) AS keep_id
  FROM public.token_usage
  WHERE model_key IS NULL
  GROUP BY user_id, model_tier
) AS agg
WHERE keep.model_key IS NULL
  AND keep.user_id = agg.user_id
  AND keep.model_tier = agg.model_tier
  AND keep.id = agg.keep_id;

-- Step 2: Delete all NULL-model_key rows EXCEPT the one we just updated
DELETE FROM public.token_usage
WHERE model_key IS NULL
  AND id NOT IN (
    SELECT MIN(id)
    FROM public.token_usage
    WHERE model_key IS NULL
    GROUP BY user_id, model_tier
  );

-- ============================================================
-- 4. Re-grant execute permissions (functions were recreated)
-- ============================================================
GRANT EXECUTE ON FUNCTION public.check_token_limits TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_token_usage TO authenticated;

-- ============================================================
-- 5. Add a partial UNIQUE index to ensure only ONE NULL-model_key
--    row per (user_id, model_tier) — prevents future orphaned rows
-- ============================================================
-- PostgreSQL UNIQUE constraints treat NULL as distinct, so without
-- this partial index, multiple NULL-model_key rows could coexist.
-- This index enforces uniqueness specifically for NULL model_key rows.
CREATE UNIQUE INDEX IF NOT EXISTS idx_token_usage_null_key_unique
  ON public.token_usage (user_id, model_tier)
  WHERE model_key IS NULL;

-- ============================================================
-- 6. Comments documenting the fix
-- ============================================================
COMMENT ON FUNCTION public.check_token_limits IS
  'Checks token limits with NULL-safe model_key matching (IS NOT DISTINCT FROM). Returns future reset_at when reset is needed. Fixed 2025-08-05.';

COMMENT ON FUNCTION public.increment_token_usage IS
  'Atomically increments token usage with NULL-safe model_key matching, ON CONFLICT for race safety, and returns NEW reset_at after reset. Fixed 2025-08-05.';
