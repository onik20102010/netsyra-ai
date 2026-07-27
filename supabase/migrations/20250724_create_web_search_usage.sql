-- Web search usage tracking table
-- Tracks daily web search usage per user with 24-hour reset

CREATE TABLE IF NOT EXISTS public.web_search_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_count INTEGER NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_web_search_usage_user_id ON public.web_search_usage(user_id);

-- Enable RLS
ALTER TABLE public.web_search_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own web search usage (drop first for safe re-run)
DROP POLICY IF EXISTS "Users can read own web search usage" ON public.web_search_usage;
DROP POLICY IF EXISTS "Users can insert own web search usage" ON public.web_search_usage;
DROP POLICY IF EXISTS "Users can update own web search usage" ON public.web_search_usage;

CREATE POLICY "Users can read own web search usage"
  ON public.web_search_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own web search usage
CREATE POLICY "Users can insert own web search usage"
  ON public.web_search_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own web search usage
CREATE POLICY "Users can update own web search usage"
  ON public.web_search_usage
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to get or create web search usage record with auto-reset
CREATE OR REPLACE FUNCTION public.get_or_reset_web_search_usage(p_user_id UUID)
RETURNS TABLE (
  id BIGINT,
  search_count INTEGER,
  last_reset_at TIMESTAMP WITH TIME ZONE,
  daily_limit INTEGER
) AS $$
DECLARE
  v_record RECORD;
  v_daily_limit INTEGER;
BEGIN
  -- Determine daily limit based on subscription status
  SELECT COALESCE(
    CASE WHEN s.status = 'active' THEN 224 ELSE 5 END,
    5
  ) INTO v_daily_limit
  FROM subscriptions s
  WHERE s.user_id = p_user_id AND s.status = 'active'
  LIMIT 1;

  -- Try to get existing record
  SELECT * INTO v_record
  FROM web_search_usage
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO web_search_usage (user_id, search_count, last_reset_at)
    VALUES (p_user_id, 0, NOW())
    RETURNING * INTO v_record;
  -- If record exists but last reset was more than 24 hours ago, reset it
  ELSIF v_record.last_reset_at < NOW() - INTERVAL '24 hours' THEN
    UPDATE web_search_usage
    SET search_count = 0, last_reset_at = NOW(), updated_at = NOW()
    WHERE id = v_record.id
    RETURNING * INTO v_record;
  END IF;

  RETURN QUERY
  SELECT v_record.id, v_record.search_count, v_record.last_reset_at, v_daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment web search usage
CREATE OR REPLACE FUNCTION public.increment_web_search_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_current_count INTEGER;
  v_daily_limit INTEGER;
BEGIN
  -- Get current usage and limit
  SELECT search_count INTO v_current_count
  FROM get_or_reset_web_search_usage(p_user_id)
  LIMIT 1;

  -- Get daily limit
  SELECT COALESCE(
    CASE WHEN s.status = 'active' THEN 224 ELSE 5 END,
    5
  ) INTO v_daily_limit
  FROM subscriptions s
  WHERE s.user_id = p_user_id AND s.status = 'active'
  LIMIT 1;

  -- Check if limit reached
  IF v_current_count >= v_daily_limit THEN
    RETURN -1; -- Limit reached
  END IF;

  -- Increment count
  UPDATE web_search_usage
  SET search_count = search_count + 1, updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_current_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
