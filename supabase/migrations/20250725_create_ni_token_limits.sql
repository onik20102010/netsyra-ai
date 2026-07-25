-- ============================================================
-- NI Token Usage Tracking (Claude Opus 4.6, Sonnet 4.6, DeepSeek V4 Pro)
-- Daily limits: Opus 10k, Sonnet 16k, DeepSeek 34k tokens
-- ============================================================

-- Drop old policies (if they exist) so we can recreate cleanly
DROP POLICY IF EXISTS "Users can view their own token usage" ON public.ni_token_usage;
DROP POLICY IF EXISTS "Users can insert their own token usage" ON public.ni_token_usage;
DROP POLICY IF EXISTS "Users can update their own token usage" ON public.ni_token_usage;

-- Table
CREATE TABLE IF NOT EXISTS public.ni_token_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL CHECK (model_type IN ('claude-opus-4.6', 'claude-sonnet-4.6', 'deepseek-v4-pro')),
  tokens_used INTEGER NOT NULL DEFAULT 0,
  daily_limit INTEGER NOT NULL,
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, model_type)   -- ensures one row per user per model
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_ni_token_usage_user_model ON public.ni_token_usage(user_id, model_type);
CREATE INDEX IF NOT EXISTS idx_ni_token_usage_last_reset ON public.ni_token_usage(last_reset_at);

-- Enable RLS
ALTER TABLE public.ni_token_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies (recreated cleanly)
CREATE POLICY "Users can view their own token usage"
  ON public.ni_token_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own token usage"
  ON public.ni_token_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own token usage"
  ON public.ni_token_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------
-- 1. Reset or get daily usage (returns tokens_used, limit, remaining, last_reset)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_or_reset_ni_token_usage(
  p_user_id UUID,
  p_model_type TEXT
)
RETURNS TABLE (
  tokens_used INTEGER,
  daily_limit INTEGER,
  remaining_tokens INTEGER,
  last_reset_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_daily_limit INTEGER;
  v_last_reset TIMESTAMP WITH TIME ZONE;
  v_tokens_used INTEGER;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Set daily limits
  CASE p_model_type
    WHEN 'claude-opus-4.6' THEN v_daily_limit := 10000;
    WHEN 'claude-sonnet-4.6' THEN v_daily_limit := 16000;
    WHEN 'deepseek-v4-pro' THEN v_daily_limit := 34000;
    ELSE v_daily_limit := 0;
  END CASE;

  -- Fetch current record
  SELECT tokens_used, last_reset_at INTO v_tokens_used, v_last_reset
  FROM public.ni_token_usage
  WHERE user_id = p_user_id AND model_type = p_model_type;

  -- If no record or more than 24h since last reset, create/reset
  IF v_tokens_used IS NULL OR v_last_reset < (v_now - INTERVAL '24 hours') THEN
    INSERT INTO public.ni_token_usage (user_id, model_type, tokens_used, daily_limit, last_reset_at)
    VALUES (p_user_id, p_model_type, 0, v_daily_limit, v_now)
    ON CONFLICT (user_id, model_type) DO UPDATE SET
      tokens_used = 0,
      daily_limit = v_daily_limit,
      last_reset_at = v_now,
      updated_at = v_now;

    v_tokens_used := 0;
    v_last_reset := v_now;
  END IF;

  RETURN QUERY SELECT
    v_tokens_used,
    v_daily_limit,
    v_daily_limit - v_tokens_used,
    v_last_reset;
END;
$$;

-- ---------------------------------------------------------
-- 2. Deduct tokens (returns remaining tokens after deduction, or -1 if insufficient)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_ni_tokens(
  p_user_id UUID,
  p_model_type TEXT,
  p_tokens INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tokens_used INTEGER;
  v_daily_limit INTEGER;
  v_remaining INTEGER;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Get current usage (auto‑reset if necessary)
  SELECT tokens_used, daily_limit INTO v_tokens_used, v_daily_limit
  FROM public.ni_token_usage
  WHERE user_id = p_user_id AND model_type = p_model_type;

  IF v_tokens_used IS NULL THEN
    RETURN -1;  -- no record (should not happen if get_or_reset used first)
  END IF;

  -- Check reset
  IF (SELECT last_reset_at FROM public.ni_token_usage WHERE user_id = p_user_id AND model_type = p_model_type) < (v_now - INTERVAL '24 hours') THEN
    UPDATE public.ni_token_usage
    SET tokens_used = 0, last_reset_at = v_now, updated_at = v_now
    WHERE user_id = p_user_id AND model_type = p_model_type;
    v_tokens_used := 0;
  END IF;

  v_remaining := v_daily_limit - v_tokens_used;

  IF v_remaining < p_tokens THEN
    RETURN -1;   -- not enough tokens
  END IF;

  UPDATE public.ni_token_usage
  SET tokens_used = tokens_used + p_tokens, updated_at = v_now
  WHERE user_id = p_user_id AND model_type = p_model_type;

  RETURN v_remaining - p_tokens;   -- new remaining tokens
END;
$$;

-- ---------------------------------------------------------
-- 3. Check if ALL model limits are exhausted (returns true/false)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_ni_limits_exhausted(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_opus_remaining INTEGER;
  v_sonnet_remaining INTEGER;
  v_deepseek_remaining INTEGER;
BEGIN
  SELECT remaining_tokens INTO v_opus_remaining
  FROM public.get_or_reset_ni_token_usage(p_user_id, 'claude-opus-4.6')
  LIMIT 1;

  SELECT remaining_tokens INTO v_sonnet_remaining
  FROM public.get_or_reset_ni_token_usage(p_user_id, 'claude-sonnet-4.6')
  LIMIT 1;

  SELECT remaining_tokens INTO v_deepseek_remaining
  FROM public.get_or_reset_ni_token_usage(p_user_id, 'deepseek-v4-pro')
  LIMIT 1;

  RETURN COALESCE(v_opus_remaining, 0) <= 0
    AND COALESCE(v_sonnet_remaining, 0) <= 0
    AND COALESCE(v_deepseek_remaining, 0) <= 0;
END;
$$;

-- ---------------------------------------------------------
-- 4. Get total remaining tokens across all models (for UI)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_total_ni_remaining(
  p_user_id UUID
)
RETURNS TABLE (
  opus_remaining INTEGER,
  sonnet_remaining INTEGER,
  deepseek_remaining INTEGER,
  total_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT remaining_tokens FROM public.get_or_reset_ni_token_usage(p_user_id, 'claude-opus-4.6') LIMIT 1),
    (SELECT remaining_tokens FROM public.get_or_reset_ni_token_usage(p_user_id, 'claude-sonnet-4.6') LIMIT 1),
    (SELECT remaining_tokens FROM public.get_or_reset_ni_token_usage(p_user_id, 'deepseek-v4-pro') LIMIT 1),
    (SELECT COALESCE(SUM(remaining_tokens), 0) FROM (
      SELECT remaining_tokens FROM public.get_or_reset_ni_token_usage(p_user_id, 'claude-opus-4.6')
      UNION ALL
      SELECT remaining_tokens FROM public.get_or_reset_ni_token_usage(p_user_id, 'claude-sonnet-4.6')
      UNION ALL
      SELECT remaining_tokens FROM public.get_or_reset_ni_token_usage(p_user_id, 'deepseek-v4-pro')
    ) AS remaining);
END;
$$;

-- ---------------------------------------------------------
-- 5. NI Router: Pick the best available model (fallback logic)
--    Returns the model name, or NULL if all limits exhausted.
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ni_get_next_available_model(
  p_user_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  -- 1. Try Opus
  SELECT remaining_tokens INTO v_remaining
  FROM public.get_or_reset_ni_token_usage(p_user_id, 'claude-opus-4.6')
  LIMIT 1;
  IF COALESCE(v_remaining, 0) > 0 THEN
    RETURN 'claude-opus-4.6';
  END IF;

  -- 2. Fallback to Sonnet
  SELECT remaining_tokens INTO v_remaining
  FROM public.get_or_reset_ni_token_usage(p_user_id, 'claude-sonnet-4.6')
  LIMIT 1;
  IF COALESCE(v_remaining, 0) > 0 THEN
    RETURN 'claude-sonnet-4.6';
  END IF;

  -- 3. Fallback to DeepSeek
  SELECT remaining_tokens INTO v_remaining
  FROM public.get_or_reset_ni_token_usage(p_user_id, 'deepseek-v4-pro')
  LIMIT 1;
  IF COALESCE(v_remaining, 0) > 0 THEN
    RETURN 'deepseek-v4-pro';
  END IF;

  -- All exhausted
  RETURN NULL;
END;
$$;

-- ---------------------------------------------------------
-- 6. Generate UI message when all limits are exhausted.
--    Returns a human‑readable string you can display to the user.
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ni_exhaustion_message(
  p_user_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exhausted BOOLEAN;
  v_next_reset TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT public.check_ni_limits_exhausted(p_user_id) INTO v_exhausted;
  IF v_exhausted IS TRUE THEN
    -- Find the earliest reset time among all models
    SELECT MIN(last_reset_at + INTERVAL '24 hours') INTO v_next_reset
    FROM public.ni_token_usage
    WHERE user_id = p_user_id;

    RETURN 'Your coding balance is exhausted. Please wait until '
           || to_char(v_next_reset, 'YYYY-MM-DD HH24:MI:SS')
           || ' UTC for your limits to reset.';
  ELSE
    RETURN 'You still have tokens available.';
  END IF;
END;
$$;
