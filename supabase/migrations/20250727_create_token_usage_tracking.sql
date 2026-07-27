-- Create token usage tracking table for Go Plus and higher plans
-- This tracks token consumption instead of message count
-- For Plus Pro, tracks per-model token usage

CREATE TABLE IF NOT EXISTS public.token_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_tier VARCHAR(50) NOT NULL,
  model_key VARCHAR(50), -- Specific model within tier (for Plus Pro)
  tokens_used BIGINT NOT NULL DEFAULT 0,
  daily_tokens_used BIGINT NOT NULL DEFAULT 0,
  monthly_tokens_used BIGINT NOT NULL DEFAULT 0,
  daily_reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
  monthly_reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, model_tier, model_key)
);

-- Add model_key column if table exists without it (for backwards compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_usage' AND column_name = 'model_key'
  ) THEN
    ALTER TABLE public.token_usage ADD COLUMN model_key VARCHAR(50);
    -- Drop old unique constraint and add new one
    ALTER TABLE public.token_usage DROP CONSTRAINT IF EXISTS token_usage_user_id_model_tier_key;
    ALTER TABLE public.token_usage ADD CONSTRAINT token_usage_user_id_model_tier_model_key_key UNIQUE(user_id, model_tier, model_key);
  END IF;
END $$;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON public.token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_model_tier ON public.token_usage(model_tier);
CREATE INDEX IF NOT EXISTS idx_token_usage_model_key ON public.token_usage(model_key);
CREATE INDEX IF NOT EXISTS idx_token_usage_daily_reset ON public.token_usage(daily_reset_at);
CREATE INDEX IF NOT EXISTS idx_token_usage_monthly_reset ON public.token_usage(monthly_reset_at);

-- Drop old functions if they exist with different signatures
DROP FUNCTION IF EXISTS public.increment_token_usage(UUID, VARCHAR(50), BIGINT);
DROP FUNCTION IF EXISTS public.check_token_limits(UUID, VARCHAR(50), BIGINT, BIGINT);

-- Create a function to increment token usage atomically
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
BEGIN
  -- Get current record or create if doesn't exist
  SELECT * INTO v_current_record
  FROM public.token_usage
  WHERE user_id = p_user_id AND model_tier = p_model_tier AND model_key = p_model_key
  FOR UPDATE;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.token_usage (
      user_id,
      model_tier,
      model_key,
      tokens_used,
      daily_tokens_used,
      monthly_tokens_used,
      daily_reset_at,
      monthly_reset_at
    ) VALUES (
      p_user_id,
      p_model_tier,
      p_model_key,
      p_tokens,
      p_tokens,
      p_tokens,
      v_now + INTERVAL '1 day',
      v_now + INTERVAL '1 month'
    )
    RETURNING * INTO v_current_record;

    RETURN jsonb_build_object(
      'success', true,
      'daily_tokens_used', p_tokens,
      'monthly_tokens_used', p_tokens,
      'daily_reset_at', v_current_record.daily_reset_at,
      'monthly_reset_at', v_current_record.monthly_reset_at
    );
  END IF;

  -- Check if daily reset is needed
  IF v_current_record.daily_reset_at < v_now THEN
    v_new_daily_tokens := p_tokens;
    UPDATE public.token_usage
    SET
      daily_tokens_used = p_tokens,
      daily_reset_at = v_now + INTERVAL '1 day',
      updated_at = v_now
    WHERE user_id = p_user_id AND model_tier = p_model_tier AND model_key = p_model_key;
  ELSE
    v_new_daily_tokens := v_current_record.daily_tokens_used + p_tokens;
    UPDATE public.token_usage
    SET
      daily_tokens_used = v_new_daily_tokens,
      updated_at = v_now
    WHERE user_id = p_user_id AND model_tier = p_model_tier AND model_key = p_model_key;
  END IF;

  -- Check if monthly reset is needed
  IF v_current_record.monthly_reset_at < v_now THEN
    v_new_monthly_tokens := p_tokens;
    UPDATE public.token_usage
    SET
      monthly_tokens_used = p_tokens,
      monthly_reset_at = v_now + INTERVAL '1 month',
      updated_at = v_now
    WHERE user_id = p_user_id AND model_tier = p_model_tier AND model_key = p_model_key;
  ELSE
    v_new_monthly_tokens := v_current_record.monthly_tokens_used + p_tokens;
    UPDATE public.token_usage
    SET
      monthly_tokens_used = v_new_monthly_tokens,
      updated_at = v_now
    WHERE user_id = p_user_id AND model_tier = p_model_tier AND model_key = p_model_key;
  END IF;

  -- Update total tokens used
  UPDATE public.token_usage
  SET
    tokens_used = tokens_used + p_tokens,
    updated_at = v_now
  WHERE user_id = p_user_id AND model_tier = p_model_tier AND model_key = p_model_key;

  RETURN jsonb_build_object(
    'success', true,
    'daily_tokens_used', v_new_daily_tokens,
    'monthly_tokens_used', v_new_monthly_tokens,
    'daily_reset_at', v_current_record.daily_reset_at,
    'monthly_reset_at', v_current_record.monthly_reset_at
  );
END;
$$ LANGUAGE plpgsql;

-- Create a function to check token limits
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
BEGIN
  -- Get current record
  SELECT * INTO v_current_record
  FROM public.token_usage
  WHERE user_id = p_user_id AND model_tier = p_model_tier AND model_key = p_model_key;

  -- If no record exists, user hasn't used any tokens yet
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'daily_tokens_used', 0,
      'monthly_tokens_used', 0,
      'daily_remaining', p_daily_limit,
      'monthly_remaining', p_monthly_limit,
      'daily_reset_at', v_now + INTERVAL '1 day',
      'monthly_reset_at', v_now + INTERVAL '1 month'
    );
  END IF;

  -- Check if daily reset is needed
  IF v_current_record.daily_reset_at < v_now THEN
    v_daily_remaining := p_daily_limit;
  ELSE
    v_daily_remaining := p_daily_limit - v_current_record.daily_tokens_used;
  END IF;

  -- Check if monthly reset is needed
  IF v_current_record.monthly_reset_at < v_now THEN
    v_monthly_remaining := p_monthly_limit;
  ELSE
    v_monthly_remaining := p_monthly_limit - v_current_record.monthly_tokens_used;
  END IF;

  -- Determine if allowed
  v_allowed := v_daily_remaining > 0 AND v_monthly_remaining > 0;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'daily_tokens_used', COALESCE(v_current_record.daily_tokens_used, 0),
    'monthly_tokens_used', COALESCE(v_current_record.monthly_tokens_used, 0),
    'daily_remaining', GREATEST(0, v_daily_remaining),
    'monthly_remaining', GREATEST(0, v_monthly_remaining),
    'daily_reset_at', v_current_record.daily_reset_at,
    'monthly_reset_at', v_current_record.monthly_reset_at
  );
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop if exists first)
DROP POLICY IF EXISTS "Users can view their own token usage" ON public.token_usage;
CREATE POLICY "Users can view their own token usage"
  ON public.token_usage FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own token usage" ON public.token_usage;
CREATE POLICY "Users can insert their own token usage"
  ON public.token_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own token usage" ON public.token_usage;
CREATE POLICY "Users can update their own token usage"
  ON public.token_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.increment_token_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_token_limits TO authenticated;
