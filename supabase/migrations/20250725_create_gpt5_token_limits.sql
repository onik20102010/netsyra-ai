-- ============================================================
-- GPT-5 Token Usage Tracking (GPT-5 and GPT-5-mini)
-- Daily limits: GPT-5 20k, GPT-5-mini 34k tokens
-- Used for: reasoning, puzzles, planning, advice, teaching, creativity
-- ============================================================

-- Table
CREATE TABLE IF NOT EXISTS public.gpt5_token_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL CHECK (model_type IN ('gpt-5', 'gpt-5-mini')),
  tokens_used INTEGER NOT NULL DEFAULT 0,
  daily_limit INTEGER NOT NULL,
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, model_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gpt5_token_usage_user_model ON public.gpt5_token_usage(user_id, model_type);
CREATE INDEX IF NOT EXISTS idx_gpt5_token_usage_last_reset ON public.gpt5_token_usage(last_reset_at);

-- Enable RLS
ALTER TABLE public.gpt5_token_usage ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they already exist (safe now because table exists)
DROP POLICY IF EXISTS "Users can view their own GPT-5 token usage" ON public.gpt5_token_usage;
DROP POLICY IF EXISTS "Users can insert their own GPT-5 token usage" ON public.gpt5_token_usage;
DROP POLICY IF EXISTS "Users can update their own GPT-5 token usage" ON public.gpt5_token_usage;

-- RLS Policies
CREATE POLICY "Users can view their own GPT-5 token usage"
  ON public.gpt5_token_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own GPT-5 token usage"
  ON public.gpt5_token_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own GPT-5 token usage"
  ON public.gpt5_token_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- Functions for GPT-5 Token Management
-- ============================================================

CREATE OR REPLACE FUNCTION get_or_reset_gpt5_token_usage(
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
  v_usage RECORD;
  v_daily_limit INTEGER;
  v_hours_since_reset NUMERIC;
BEGIN
  IF p_model_type = 'gpt-5' THEN
    v_daily_limit := 20000;
  ELSIF p_model_type = 'gpt-5-mini' THEN
    v_daily_limit := 34000;
  ELSE
    RAISE EXCEPTION 'Invalid model type: %', p_model_type;
  END IF;

  SELECT * INTO v_usage
  FROM public.gpt5_token_usage
  WHERE user_id = p_user_id AND model_type = p_model_type;

  IF NOT FOUND THEN
    INSERT INTO public.gpt5_token_usage (user_id, model_type, tokens_used, daily_limit, last_reset_at)
    VALUES (p_user_id, p_model_type, 0, v_daily_limit, NOW());
    
    RETURN QUERY SELECT
      0::INTEGER, v_daily_limit, v_daily_limit, NOW()::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;

  v_hours_since_reset := EXTRACT(EPOCH FROM (NOW() - v_usage.last_reset_at)) / 3600;
  
  IF v_hours_since_reset >= 24 THEN
    UPDATE public.gpt5_token_usage
    SET tokens_used = 0, last_reset_at = NOW(), updated_at = NOW()
    WHERE user_id = p_user_id AND model_type = p_model_type;
    
    RETURN QUERY SELECT
      0::INTEGER, v_daily_limit, v_daily_limit, NOW()::TIMESTAMP WITH TIME ZONE;
  ELSE
    RETURN QUERY SELECT
      v_usage.tokens_used,
      v_usage.daily_limit,
      (v_usage.daily_limit - v_usage.tokens_used)::INTEGER,
      v_usage.last_reset_at;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION deduct_gpt5_tokens(
  p_user_id UUID,
  p_model_type TEXT,
  p_tokens INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage RECORD;
  v_remaining INTEGER;
BEGIN
  SELECT * INTO v_usage
  FROM get_or_reset_gpt5_token_usage(p_user_id, p_model_type);
  
  IF NOT FOUND THEN
    RETURN -1;
  END IF;
  
  v_remaining := v_usage.remaining_tokens;
  
  IF v_remaining < p_tokens THEN
    RETURN -1;
  END IF;
  
  UPDATE public.gpt5_token_usage
  SET tokens_used = tokens_used + p_tokens, updated_at = NOW()
  WHERE user_id = p_user_id AND model_type = p_model_type;
  
  RETURN v_remaining - p_tokens;
END;
$$;

CREATE OR REPLACE FUNCTION check_gpt5_limits_exhausted(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gpt5_remaining INTEGER;
  v_mini_remaining INTEGER;
BEGIN
  SELECT remaining_tokens INTO v_gpt5_remaining
  FROM get_or_reset_gpt5_token_usage(p_user_id, 'gpt-5');
  
  SELECT remaining_tokens INTO v_mini_remaining
  FROM get_or_reset_gpt5_token_usage(p_user_id, 'gpt-5-mini');
  
  RETURN (v_gpt5_remaining <= 0 AND v_mini_remaining <= 0);
END;
$$;

CREATE OR REPLACE FUNCTION get_total_gpt5_remaining(
  p_user_id UUID
)
RETURNS TABLE (
  gpt5_remaining INTEGER,
  mini_remaining INTEGER,
  total_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT remaining_tokens FROM get_or_reset_gpt5_token_usage(p_user_id, 'gpt-5'))::INTEGER,
    (SELECT remaining_tokens FROM get_or_reset_gpt5_token_usage(p_user_id, 'gpt-5-mini'))::INTEGER,
    (SELECT COALESCE(SUM(remaining_tokens), 0)::INTEGER FROM (
      SELECT remaining_tokens FROM get_or_reset_gpt5_token_usage(p_user_id, 'gpt-5')
      UNION ALL
      SELECT remaining_tokens FROM get_or_reset_gpt5_token_usage(p_user_id, 'gpt-5-mini')
    ) sub);
END;
$$;

CREATE OR REPLACE FUNCTION gpt5_get_next_available_model(
  p_user_id UUID,
  p_tokens_needed INTEGER DEFAULT 1000
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gpt5_remaining INTEGER;
  v_mini_remaining INTEGER;
BEGIN
  SELECT remaining_tokens INTO v_gpt5_remaining
  FROM get_or_reset_gpt5_token_usage(p_user_id, 'gpt-5');
  
  SELECT remaining_tokens INTO v_mini_remaining
  FROM get_or_reset_gpt5_token_usage(p_user_id, 'gpt-5-mini');
  
  IF v_gpt5_remaining >= p_tokens_needed THEN
    RETURN 'gpt-5';
  END IF;
  
  IF v_mini_remaining >= p_tokens_needed THEN
    RETURN 'gpt-5-mini';
  END IF;
  
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION gpt5_exhaustion_message(
  p_user_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_reset TIMESTAMP WITH TIME ZONE;
  v_hours_until_reset NUMERIC;
BEGIN
  SELECT last_reset_at INTO v_last_reset
  FROM public.gpt5_token_usage
  WHERE user_id = p_user_id AND model_type = 'gpt-5'
  LIMIT 1;
  
  IF v_last_reset IS NULL THEN
    RETURN 'Your daily GPT-5 token limits have been exhausted. Please wait 24 hours for reset.';
  END IF;
  
  v_hours_until_reset := 24 - (EXTRACT(EPOCH FROM (NOW() - v_last_reset)) / 3600);
  
  IF v_hours_until_reset <= 0 THEN
    RETURN 'Your daily GPT-5 token limits have been exhausted. Limits will reset shortly.';
  END IF;
  
  RETURN format('Your daily GPT-5 token limits have been exhausted. Limits will reset in approximately %.1f hours.', v_hours_until_reset);
END;
$$;

GRANT EXECUTE ON FUNCTION get_or_reset_gpt5_token_usage TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_gpt5_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION check_gpt5_limits_exhausted TO authenticated;
GRANT EXECUTE ON FUNCTION get_total_gpt5_remaining TO authenticated;
GRANT EXECUTE ON FUNCTION gpt5_get_next_available_model TO authenticated;
GRANT EXECUTE ON FUNCTION gpt5_exhaustion_message TO authenticated;
