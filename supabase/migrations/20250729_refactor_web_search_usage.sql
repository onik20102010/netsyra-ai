-- Refactor web_search_usage table for plan-aware limits with time windows
-- Each search is a row; counting rows in a time window replaces the old single-row counter

-- Drop old functions that used the single-row approach
DROP FUNCTION IF EXISTS public.get_or_reset_web_search_usage(p_user_id UUID);
DROP FUNCTION IF EXISTS public.increment_web_search_usage(p_user_id UUID);

-- Recreate table with per-event tracking (one row per search)
DROP TABLE IF EXISTS public.web_search_usage;

CREATE TABLE IF NOT EXISTS public.web_search_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for fast counting within a time window
CREATE INDEX IF NOT EXISTS idx_web_search_usage_user_id ON public.web_search_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_web_search_usage_user_created ON public.web_search_usage(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.web_search_usage ENABLE ROW LEVEL SECURITY;

-- Policies: users can read and insert their own usage
DROP POLICY IF EXISTS "Users can read own web search usage" ON public.web_search_usage;
DROP POLICY IF EXISTS "Users can insert own web search usage" ON public.web_search_usage;

CREATE POLICY "Users can read own web search usage"
  ON public.web_search_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own web search usage"
  ON public.web_search_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Helper function to count searches in a time window
CREATE OR REPLACE FUNCTION public.count_web_searches_in_window(
  p_user_id UUID,
  p_window_hours INTEGER DEFAULT 24
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.web_search_usage
  WHERE user_id = p_user_id
    AND created_at >= NOW() - (p_window_hours || ' hours')::INTERVAL;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to clean up old usage records (optional, run via cron)
CREATE OR REPLACE FUNCTION public.cleanup_old_web_search_usage(
  p_days_to_keep INTEGER DEFAULT 7
)
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.web_search_usage
  WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
