-- NI Model Limits Tracking
-- Tracks Claude credits, image generation, and image analysis usage

-- Claude Sonnet credits table
CREATE TABLE IF NOT EXISTS public.claude_credits (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_remaining INTEGER NOT NULL DEFAULT 100,
  billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '1 month',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Image generation usage table
CREATE TABLE IF NOT EXISTS public.image_generation_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  images_4hr_count INTEGER NOT NULL DEFAULT 0,
  images_4hr_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  images_month_count INTEGER NOT NULL DEFAULT 0,
  images_month_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Image analysis usage table
CREATE TABLE IF NOT EXISTS public.image_analysis_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  images_month_count INTEGER NOT NULL DEFAULT 0,
  images_month_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_claude_credits_user_id ON public.claude_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_image_generation_user_id ON public.image_generation_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_image_analysis_user_id ON public.image_analysis_usage(user_id);

-- Enable RLS
ALTER TABLE public.claude_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_generation_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_analysis_usage ENABLE ROW LEVEL SECURITY;

-- Claude credits policies
CREATE POLICY "Users can read own claude credits"
  ON public.claude_credits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own claude credits"
  ON public.claude_credits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own claude credits"
  ON public.claude_credits
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Image generation policies
CREATE POLICY "Users can read own image generation usage"
  ON public.image_generation_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own image generation usage"
  ON public.image_generation_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own image generation usage"
  ON public.image_generation_usage
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Image analysis policies
CREATE POLICY "Users can read own image analysis usage"
  ON public.image_analysis_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own image analysis usage"
  ON public.image_analysis_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own image analysis usage"
  ON public.image_analysis_usage
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to get or reset Claude credits
CREATE OR REPLACE FUNCTION public.get_or_reset_claude_credits(p_user_id UUID)
RETURNS TABLE (
  id BIGINT,
  credits_remaining INTEGER,
  billing_period_start TIMESTAMP WITH TIME ZONE,
  billing_period_end TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_record RECORD;
BEGIN
  -- Try to get existing record
  SELECT * INTO v_record
  FROM claude_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO claude_credits (user_id, credits_remaining, billing_period_start, billing_period_end)
    VALUES (p_user_id, 100, NOW(), NOW() + INTERVAL '1 month')
    RETURNING * INTO v_record;
  -- If billing period ended, reset credits
  ELSIF v_record.billing_period_end < NOW() THEN
    UPDATE claude_credits
    SET credits_remaining = 100, 
        billing_period_start = NOW(), 
        billing_period_end = NOW() + INTERVAL '1 month',
        updated_at = NOW()
    WHERE id = v_record.id
    RETURNING * INTO v_record;
  END IF;

  RETURN QUERY
  SELECT v_record.id, v_record.credits_remaining, v_record.billing_period_start, v_record.billing_period_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct Claude credits
CREATE OR REPLACE FUNCTION public.deduct_claude_credits(p_user_id UUID, p_credits INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits_remaining INTO v_current_credits
  FROM get_or_reset_claude_credits(p_user_id)
  LIMIT 1;

  -- Check if enough credits
  IF v_current_credits < p_credits THEN
    RETURN -1; -- Not enough credits
  END IF;

  -- Deduct credits
  UPDATE claude_credits
  SET credits_remaining = credits_remaining - p_credits, updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_current_credits - p_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or reset image generation usage
CREATE OR REPLACE FUNCTION public.get_or_reset_image_generation_usage(p_user_id UUID)
RETURNS TABLE (
  id BIGINT,
  images_4hr_count INTEGER,
  images_4hr_reset_at TIMESTAMP WITH TIME ZONE,
  images_month_count INTEGER,
  images_month_reset_at TIMESTAMP WITH TIME ZONE,
  remaining_4hr INTEGER,
  remaining_month INTEGER
) AS $$
DECLARE
  v_record RECORD;
  v_remaining_4hr INTEGER;
  v_remaining_month INTEGER;
BEGIN
  -- Try to get existing record
  SELECT * INTO v_record
  FROM image_generation_usage
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO image_generation_usage (user_id, images_4hr_count, images_4hr_reset_at, images_month_count, images_month_reset_at)
    VALUES (p_user_id, 0, NOW(), 0, DATE_TRUNC('month', NOW()) + INTERVAL '1 month')
    RETURNING * INTO v_record;
  ELSE
    -- Check if 4-hour reset needed
    IF v_record.images_4hr_reset_at < NOW() - INTERVAL '4 hours' THEN
      UPDATE image_generation_usage
      SET images_4hr_count = 0, images_4hr_reset_at = NOW(), updated_at = NOW()
      WHERE id = v_record.id
      RETURNING * INTO v_record;
    END IF;
    
    -- Check if monthly reset needed
    IF v_record.images_month_reset_at < NOW() THEN
      UPDATE image_generation_usage
      SET images_month_count = 0, images_month_reset_at = DATE_TRUNC('month', NOW()) + INTERVAL '1 month', updated_at = NOW()
      WHERE id = v_record.id
      RETURNING * INTO v_record;
    END IF;
  END IF;

  -- Calculate remaining
  v_remaining_4hr := 10 - v_record.images_4hr_count;
  v_remaining_month := 150 - v_record.images_month_count;

  RETURN QUERY
  SELECT v_record.id, v_record.images_4hr_count, v_record.images_4hr_reset_at, 
         v_record.images_month_count, v_record.images_month_reset_at,
         v_remaining_4hr, v_remaining_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment image generation usage
CREATE OR REPLACE FUNCTION public.increment_image_generation(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_remaining_4hr INTEGER;
  v_remaining_month INTEGER;
BEGIN
  -- Get current usage
  SELECT remaining_4hr, remaining_month INTO v_remaining_4hr, v_remaining_month
  FROM get_or_reset_image_generation_usage(p_user_id)
  LIMIT 1;

  -- Check limits
  IF v_remaining_4hr <= 0 THEN
    RETURN -1; -- 4-hour limit reached
  END IF;
  
  IF v_remaining_month <= 0 THEN
    RETURN -2; -- Monthly limit reached
  END IF;

  -- Increment counts
  UPDATE image_generation_usage
  SET images_4hr_count = images_4hr_count + 1,
      images_month_count = images_month_count + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_remaining_month - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or reset image analysis usage
CREATE OR REPLACE FUNCTION public.get_or_reset_image_analysis_usage(p_user_id UUID)
RETURNS TABLE (
  id BIGINT,
  images_month_count INTEGER,
  images_month_reset_at TIMESTAMP WITH TIME ZONE,
  remaining_month INTEGER
) AS $$
DECLARE
  v_record RECORD;
  v_remaining_month INTEGER;
BEGIN
  -- Try to get existing record
  SELECT * INTO v_record
  FROM image_analysis_usage
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO image_analysis_usage (user_id, images_month_count, images_month_reset_at)
    VALUES (p_user_id, 0, DATE_TRUNC('month', NOW()) + INTERVAL '1 month')
    RETURNING * INTO v_record;
  -- If monthly reset needed
  ELSIF v_record.images_month_reset_at < NOW() THEN
    UPDATE image_analysis_usage
    SET images_month_count = 0, images_month_reset_at = DATE_TRUNC('month', NOW()) + INTERVAL '1 month', updated_at = NOW()
    WHERE id = v_record.id
    RETURNING * INTO v_record;
  END IF;

  -- Calculate remaining
  v_remaining_month := 300 - v_record.images_month_count;

  RETURN QUERY
  SELECT v_record.id, v_record.images_month_count, v_record.images_month_reset_at, v_remaining_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment image analysis usage
CREATE OR REPLACE FUNCTION public.increment_image_analysis(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_remaining_month INTEGER;
BEGIN
  -- Get current usage
  SELECT remaining_month INTO v_remaining_month
  FROM get_or_reset_image_analysis_usage(p_user_id)
  LIMIT 1;

  -- Check limit
  IF v_remaining_month <= 0 THEN
    RETURN -1; -- Monthly limit reached
  END IF;

  -- Increment count
  UPDATE image_analysis_usage
  SET images_month_count = images_month_count + 1, updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_remaining_month - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
