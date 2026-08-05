-- ============================================================
-- RUN THIS: Cleanup orphaned NULL model_key rows + create unique index
-- (The functions in 20250805e were already created successfully,
--  only the cleanup/index failed. This fixes that.)
-- ============================================================

-- Step 1: Consolidate totals into the oldest row per (user_id, model_tier)
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

-- Step 2: Delete all NULL-model_key rows EXCEPT the consolidated one
DELETE FROM public.token_usage
WHERE model_key IS NULL
  AND id NOT IN (
    SELECT MIN(id)
    FROM public.token_usage
    WHERE model_key IS NULL
    GROUP BY user_id, model_tier
  );

-- Step 3: Create the partial unique index (now safe — no duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_token_usage_null_key_unique
  ON public.token_usage (user_id, model_tier)
  WHERE model_key IS NULL;
