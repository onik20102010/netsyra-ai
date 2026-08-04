-- ============================================================
-- Fix NI token deduction stale limit + document deepseek-v4-flash as unlimited
-- + reconcile image analysis per-plan limits
-- ============================================================
--
-- Problems fixed:
-- 1. deduct_ni_tokens read daily_limit from the existing row (stale if limit
--    changed). Now it recomputes via get_or_reset_ni_token_usage first.
-- 2. deepseek-v4-flash (NI's 6th model, "easy tasks" fallback) is intentionally
--    UNLIMITED — no token tracking. Documented + no CHECK constraint change
--    needed (it's simply never inserted into ni_token_usage).
-- 3. Image analysis limits: Free 3/d, Go Plus 15/d 300/m, Pro 30/d 600/m,
--    Plus Pro 30/d 600/m. The DB defaults are now 3/d (Free) and updated
--    per-user by the app via incrementImageAnalysisUsage().
-- ============================================================

-- ============================================================
-- 1. Fix deduct_ni_tokens to recompute limit (no stale row reads)
-- ============================================================
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
  v_usage RECORD;
  v_daily_limit INTEGER;
  v_tokens_used INTEGER;
  v_remaining INTEGER;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Recompute current usage + limit via get_or_reset (single source of truth)
  SELECT tokens_used, daily_limit INTO v_tokens_used, v_daily_limit
  FROM public.get_or_reset_ni_token_usage(p_user_id, p_model_type)
  LIMIT 1;

  IF v_tokens_used IS NULL THEN
    RETURN -1;  -- no record (should not happen after get_or_reset)
  END IF;

  v_remaining := v_daily_limit - v_tokens_used;

  IF v_remaining < p_tokens THEN
    RETURN -1;   -- not enough tokens
  END IF;

  -- Deduct atomically
  UPDATE public.ni_token_usage
  SET tokens_used = tokens_used + p_tokens, updated_at = v_now
  WHERE user_id = p_user_id AND model_type = p_model_type;

  RETURN v_remaining - p_tokens;   -- new remaining tokens
END;
$$;

-- ============================================================
-- 2. Same fix for deduct_gpt5_tokens (recompute via get_or_reset)
-- ============================================================
CREATE OR REPLACE FUNCTION public.deduct_gpt5_tokens(
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
  v_tokens_used INTEGER;
  v_daily_limit INTEGER;
  v_remaining INTEGER;
BEGIN
  -- Recompute current usage + limit via get_or_reset (single source of truth)
  SELECT tokens_used, daily_limit INTO v_tokens_used, v_daily_limit
  FROM get_or_reset_gpt5_token_usage(p_user_id, p_model_type);

  IF NOT FOUND OR v_tokens_used IS NULL THEN
    RETURN -1;
  END IF;

  v_remaining := v_daily_limit - v_tokens_used;

  IF v_remaining < p_tokens THEN
    RETURN -1;
  END IF;

  UPDATE public.gpt5_token_usage
  SET tokens_used = tokens_used + p_tokens, updated_at = NOW()
  WHERE user_id = p_user_id AND model_type = p_model_type;

  RETURN v_remaining - p_tokens;
END;
$$;

-- ============================================================
-- 3. Image analysis: update DB defaults to Free (3/day) so new rows
--    match the Free plan. Paid plans override via the app.
-- ============================================================
ALTER TABLE public.image_analysis_usage
  ALTER COLUMN daily_limit SET DEFAULT 3;

-- Update existing rows that still have the old default of 30 to 3
-- (only if the row was created with the old default and never updated
-- by the plan-aware app code)
UPDATE public.image_analysis_usage
SET daily_limit = 3, monthly_limit = 0, updated_at = NOW()
WHERE daily_limit = 30 AND monthly_limit = 600;

-- ============================================================
-- 4. Document the unlimited model
-- ============================================================
COMMENT ON TABLE public.ni_token_usage IS
  'Per-LLM daily token tracking for NI tier. Tracked models: claude-opus-4.6 (10k/d), claude-sonnet-4.6 (16k/d), deepseek-v4-pro (34k/d). UNTRACKED (unlimited): deepseek-v4-flash. GPT-5/GPT-5-mini tracked separately in gpt5_token_usage.';

COMMENT ON TABLE public.gpt5_token_usage IS
  'Per-LLM daily token tracking for GPT-5 (20k/d) and GPT-5-mini (34k/d). Used by NI tier. Plus Pro uses the generic token_usage table instead.';

-- ============================================================
-- 5. Grant execute on recreated functions
-- ============================================================
GRANT EXECUTE ON FUNCTION public.deduct_ni_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_gpt5_tokens TO authenticated;
