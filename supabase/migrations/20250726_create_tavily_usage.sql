-- Tavily usage tracking table
-- Tracks daily Tavily search usage per user with 24-hour reset
-- Free users: 3 searches per 24 hours
-- Paid users: unlimited

CREATE TABLE IF NOT EXISTS public.tavily_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_count INTEGER NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_tavily_usage_user_id ON public.tavily_usage(user_id);

-- Enable RLS
ALTER TABLE public.tavily_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own tavily usage
CREATE POLICY "Users can read own tavily usage"
  ON public.tavily_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own tavily usage
CREATE POLICY "Users can insert own tavily usage"
  ON public.tavily_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tavily usage
CREATE POLICY "Users can update own tavily usage"
  ON public.tavily_usage
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to get or create tavily usage record with auto-reset
CREATE OR REPLACE FUNCTION public.get_or_reset_tavily_usage(p_user_id UUID)
RETURNS TABLE (
  id BIGINT,
  search_count INTEGER,
  last_reset_at TIMESTAMP WITH TIME ZONE,
  daily_limit INTEGER
) AS $$
DECLARE
  v_record RECORD;
  v_daily_limit INTEGER;
  v_is_paid BOOLEAN;
BEGIN
  -- Check if user has active subscription
  SELECT COALESCE(
    CASE WHEN s.status = 'active' THEN true ELSE false END,
    false
  ) INTO v_is_paid
  FROM subscriptions s
  WHERE s.user_id = p_user_id AND s.status = 'active'
  LIMIT 1;

  -- Set daily limit: 3 for free users, unlimited (NULL) for paid users
  IF v_is_paid THEN
    v_daily_limit := NULL; -- Unlimited for paid users
  ELSE
    v_daily_limit := 3; -- 3 searches per 24 hours for free users
  END IF;

  -- Try to get existing record
  SELECT * INTO v_record
  FROM tavily_usage
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO tavily_usage (user_id, search_count, last_reset_at)
    VALUES (p_user_id, 0, NOW())
    RETURNING * INTO v_record;
  -- If record exists but last reset was more than 24 hours ago, reset it
  ELSIF v_record.last_reset_at < NOW() - INTERVAL '24 hours' THEN
    UPDATE tavily_usage
    SET search_count = 0, last_reset_at = NOW(), updated_at = NOW()
    WHERE id = v_record.id
    RETURNING * INTO v_record;
  END IF;

  RETURN QUERY
  SELECT v_record.id, v_record.search_count, v_record.last_reset_at, v_daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment tavily usage
CREATE OR REPLACE FUNCTION public.increment_tavily_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_current_count INTEGER;
  v_daily_limit INTEGER;
  v_is_paid BOOLEAN;
BEGIN
  -- Check if user has active subscription
  SELECT COALESCE(
    CASE WHEN s.status = 'active' THEN true ELSE false END,
    false
  ) INTO v_is_paid
  FROM subscriptions s
  WHERE s.user_id = p_user_id AND s.status = 'active'
  LIMIT 1;

  -- Paid users have unlimited access, skip limit check
  IF v_is_paid THEN
    UPDATE tavily_usage
    SET search_count = search_count + 1, updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Return current count (no limit enforcement for paid users)
    SELECT search_count INTO v_current_count
    FROM tavily_usage
    WHERE user_id = p_user_id;
    
    RETURN v_current_count;
  END IF;

  -- Get current usage for free users
  SELECT search_count INTO v_current_count
  FROM get_or_reset_tavily_usage(p_user_id)
  LIMIT 1;

  -- Set limit for free users
  v_daily_limit := 3;

  -- Check if limit reached
  IF v_current_count >= v_daily_limit THEN
    RETURN -1; -- Limit reached
  END IF;

  -- Increment count
  UPDATE tavily_usage
  SET search_count = search_count + 1, updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_current_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
