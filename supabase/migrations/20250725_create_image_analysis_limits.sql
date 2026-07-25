-- ============================================================
-- Image Analysis Usage Tracking
-- Daily limit: 30 images/day
-- Monthly limit: 600 images/month
-- Used for: Image analysis with Gemini Flash Lite
-- ============================================================

-- Add missing columns if table already exists (safe re-run)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'image_analysis_usage' AND table_schema = 'public') THEN
        -- Add columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'image_analysis_usage' AND column_name = 'last_daily_reset' AND table_schema = 'public') THEN
            ALTER TABLE public.image_analysis_usage ADD COLUMN last_daily_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'image_analysis_usage' AND column_name = 'last_monthly_reset' AND table_schema = 'public') THEN
            ALTER TABLE public.image_analysis_usage ADD COLUMN last_monthly_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
    END IF;
END $$;

-- Table
CREATE TABLE IF NOT EXISTS public.image_analysis_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_count INTEGER NOT NULL DEFAULT 0,
  monthly_count INTEGER NOT NULL DEFAULT 0,
  daily_limit INTEGER NOT NULL DEFAULT 30,
  monthly_limit INTEGER NOT NULL DEFAULT 600,
  last_daily_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_monthly_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_image_analysis_usage_user ON public.image_analysis_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_image_analysis_usage_daily_reset ON public.image_analysis_usage(last_daily_reset);
CREATE INDEX IF NOT EXISTS idx_image_analysis_usage_monthly_reset ON public.image_analysis_usage(last_monthly_reset);

-- Enable RLS
ALTER TABLE public.image_analysis_usage ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they already exist (safe now because table exists)
DROP POLICY IF EXISTS "Users can view their own image analysis usage" ON public.image_analysis_usage;
DROP POLICY IF EXISTS "Users can insert their own image analysis usage" ON public.image_analysis_usage;
DROP POLICY IF EXISTS "Users can update their own image analysis usage" ON public.image_analysis_usage;

-- RLS Policies
CREATE POLICY "Users can view their own image analysis usage"
  ON public.image_analysis_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own image analysis usage"
  ON public.image_analysis_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own image analysis usage"
  ON public.image_analysis_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- Functions for Image Analysis Usage Management
-- ============================================================

-- Drop existing functions to avoid return type conflicts
DROP FUNCTION IF EXISTS get_or_reset_image_analysis_usage(UUID);
DROP FUNCTION IF EXISTS deduct_image_analysis_credit(UUID);
DROP FUNCTION IF EXISTS check_image_analysis_limits_exhausted(UUID);
DROP FUNCTION IF EXISTS get_image_analysis_exhaustion_message(UUID);

CREATE OR REPLACE FUNCTION get_or_reset_image_analysis_usage(
  p_user_id UUID
)
RETURNS TABLE (
  daily_count INTEGER,
  monthly_count INTEGER,
  daily_limit INTEGER,
  monthly_limit INTEGER,
  remaining_daily INTEGER,
  remaining_monthly INTEGER,
  last_daily_reset TIMESTAMP WITH TIME ZONE,
  last_monthly_reset TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage RECORD;
  v_hours_since_daily_reset NUMERIC;
  v_days_since_monthly_reset NUMERIC;
  v_daily_limit INTEGER := 30;
  v_monthly_limit INTEGER := 600;
BEGIN
  SELECT * INTO v_usage
  FROM public.image_analysis_usage
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.image_analysis_usage (
      user_id, 
      daily_count, 
      monthly_count, 
      daily_limit, 
      monthly_limit, 
      last_daily_reset, 
      last_monthly_reset
    )
    VALUES (
      p_user_id, 
      0, 
      0, 
      v_daily_limit, 
      v_monthly_limit, 
      NOW(), 
      NOW()
    );
    
    RETURN QUERY SELECT
      0::INTEGER, 
      0::INTEGER, 
      v_daily_limit, 
      v_monthly_limit, 
      v_daily_limit::INTEGER, 
      v_monthly_limit::INTEGER, 
      NOW()::TIMESTAMP WITH TIME ZONE, 
      NOW()::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;

  -- Check if daily reset is needed (24 hours)
  v_hours_since_daily_reset := EXTRACT(EPOCH FROM (NOW() - v_usage.last_daily_reset)) / 3600;
  
  IF v_hours_since_daily_reset >= 24 THEN
    UPDATE public.image_analysis_usage
    SET daily_count = 0, last_daily_reset = NOW(), updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  -- Check if monthly reset is needed (30 days)
  v_days_since_monthly_reset := EXTRACT(EPOCH FROM (NOW() - v_usage.last_monthly_reset)) / 86400;
  
  IF v_days_since_monthly_reset >= 30 THEN
    UPDATE public.image_analysis_usage
    SET monthly_count = 0, last_monthly_reset = NOW(), updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  -- Return updated values
  RETURN QUERY
  SELECT
    u.daily_count,
    u.monthly_count,
    u.daily_limit,
    u.monthly_limit,
    (u.daily_limit - u.daily_count)::INTEGER,
    (u.monthly_limit - u.monthly_count)::INTEGER,
    u.last_daily_reset,
    u.last_monthly_reset
  FROM public.image_analysis_usage u
  WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION deduct_image_analysis_credit(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage RECORD;
  v_remaining_daily INTEGER;
  v_remaining_monthly INTEGER;
BEGIN
  SELECT * INTO v_usage
  FROM get_or_reset_image_analysis_usage(p_user_id);
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to get usage record'
    );
  END IF;
  
  v_remaining_daily := v_usage.remaining_daily;
  v_remaining_monthly := v_usage.remaining_monthly;
  
  IF v_remaining_daily <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Daily image analysis limit exceeded',
      'remaining_daily', 0,
      'remaining_monthly', v_remaining_monthly
    );
  END IF;
  
  IF v_remaining_monthly <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Monthly image analysis limit exceeded',
      'remaining_daily', v_remaining_daily,
      'remaining_monthly', 0
    );
  END IF;
  
  UPDATE public.image_analysis_usage
  SET daily_count = daily_count + 1,
      monthly_count = monthly_count + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'remaining_daily', v_remaining_daily - 1,
    'remaining_monthly', v_remaining_monthly - 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION check_image_analysis_limits_exhausted(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining_daily INTEGER;
  v_remaining_monthly INTEGER;
BEGIN
  SELECT remaining_daily, remaining_monthly INTO v_remaining_daily, v_remaining_monthly
  FROM get_or_reset_image_analysis_usage(p_user_id);
  
  RETURN (v_remaining_daily <= 0 OR v_remaining_monthly <= 0);
END;
$$;

CREATE OR REPLACE FUNCTION get_image_analysis_exhaustion_message(
  p_user_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_daily_reset TIMESTAMP WITH TIME ZONE;
  v_last_monthly_reset TIMESTAMP WITH TIME ZONE;
  v_hours_until_daily_reset NUMERIC;
  v_days_until_monthly_reset NUMERIC;
  v_message TEXT;
BEGIN
  SELECT last_daily_reset, last_monthly_reset INTO v_last_daily_reset, v_last_monthly_reset
  FROM public.image_analysis_usage
  WHERE user_id = p_user_id
  LIMIT 1;
  
  IF v_last_daily_reset IS NULL THEN
    RETURN 'Your image analysis limits have been exhausted. Please wait for reset.';
  END IF;
  
  v_hours_until_daily_reset := 24 - (EXTRACT(EPOCH FROM (NOW() - v_last_daily_reset)) / 3600);
  v_days_until_monthly_reset := 30 - (EXTRACT(EPOCH FROM (NOW() - v_last_monthly_reset)) / 86400);
  
  IF v_hours_until_daily_reset <= 0 THEN
    v_message := 'Daily limits will reset shortly.';
  ELSE
    v_message := format('Daily limits will reset in approximately %.1f hours.', v_hours_until_daily_reset);
  END IF;
  
  IF v_days_until_monthly_reset > 0 THEN
    v_message := v_message || format(' Monthly limits will reset in approximately %.1f days.', v_days_until_monthly_reset);
  END IF;
  
  RETURN 'Your image analysis limits have been exhausted. ' || v_message;
END;
$$;

GRANT EXECUTE ON FUNCTION get_or_reset_image_analysis_usage TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_image_analysis_credit TO authenticated;
GRANT EXECUTE ON FUNCTION check_image_analysis_limits_exhausted TO authenticated;
GRANT EXECUTE ON FUNCTION get_image_analysis_exhaustion_message TO authenticated;
