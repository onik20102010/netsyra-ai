-- ============================================================
-- NETSYRA — FIX MISMATCHES SQL
-- Run this in Supabase SQL Editor to fix all schema mismatches.
-- Safe to re-run: all drops are conditional.
-- ============================================================

-- ############################################################
-- FIX 1: pro_conversation_summaries — FK must reference public.conversations
--         + add missing user_id column (code upserts with user_id)
-- ############################################################

-- Drop old FK constraint and replace with correct one
ALTER TABLE public.pro_conversation_summaries
  DROP CONSTRAINT IF EXISTS pro_conversation_summaries_conversation_id_fkey;

ALTER TABLE public.pro_conversation_summaries
  ADD CONSTRAINT pro_conversation_summaries_conversation_id_fkey
  FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Add user_id column (used by storeProConvSummary in unified-memory.ts)
ALTER TABLE public.pro_conversation_summaries
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_pro_conversation_summaries_user_id
  ON public.pro_conversation_summaries(user_id);

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS "Users can view their own conversation summaries" ON public.pro_conversation_summaries;
DROP POLICY IF EXISTS "Users can insert their own conversation summaries" ON public.pro_conversation_summaries;
DROP POLICY IF EXISTS "Users can update their own conversation summaries" ON public.pro_conversation_summaries;

CREATE POLICY "Users can view their own conversation summaries"
  ON public.pro_conversation_summaries FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = (SELECT user_id FROM public.conversations WHERE id = conversation_id));

CREATE POLICY "Users can insert their own conversation summaries"
  ON public.pro_conversation_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() = (SELECT user_id FROM public.conversations WHERE id = conversation_id));

CREATE POLICY "Users can update their own conversation summaries"
  ON public.pro_conversation_summaries FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = (SELECT user_id FROM public.conversations WHERE id = conversation_id));

-- ############################################################
-- FIX 2: image_analysis_usage — keep comprehensive version only
--         Drop conflicting simple version functions
-- ############################################################

-- Drop the SIMPLE version's conflicting function (different return type)
DROP FUNCTION IF EXISTS public.get_or_reset_image_analysis_usage(UUID);
DROP FUNCTION IF EXISTS public.increment_image_analysis(UUID);

-- Now recreate the COMPREHENSIVE version's function
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
      user_id, daily_count, monthly_count, daily_limit, monthly_limit,
      last_daily_reset, last_monthly_reset
    )
    VALUES (p_user_id, 0, 0, v_daily_limit, v_monthly_limit, NOW(), NOW());
    
    RETURN QUERY SELECT
      0::INTEGER, 0::INTEGER, v_daily_limit, v_monthly_limit,
      v_daily_limit::INTEGER, v_monthly_limit::INTEGER,
      NOW()::TIMESTAMP WITH TIME ZONE, NOW()::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;

  v_hours_since_daily_reset := EXTRACT(EPOCH FROM (NOW() - v_usage.last_daily_reset)) / 3600;
  
  IF v_hours_since_daily_reset >= 24 THEN
    UPDATE public.image_analysis_usage
    SET daily_count = 0, last_daily_reset = NOW(), updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  v_days_since_monthly_reset := EXTRACT(EPOCH FROM (NOW() - v_usage.last_monthly_reset)) / 86400;
  
  IF v_days_since_monthly_reset >= 30 THEN
    UPDATE public.image_analysis_usage
    SET monthly_count = 0, last_monthly_reset = NOW(), updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  RETURN QUERY
  SELECT
    u.daily_count, u.monthly_count, u.daily_limit, u.monthly_limit,
    (u.daily_limit - u.daily_count)::INTEGER,
    (u.monthly_limit - u.monthly_count)::INTEGER,
    u.last_daily_reset, u.last_monthly_reset
  FROM public.image_analysis_usage u
  WHERE user_id = p_user_id;
END;
$$;

-- Drop and recreate image_analysis RLS policies
DROP POLICY IF EXISTS "Users can view their own image analysis usage" ON public.image_analysis_usage;
DROP POLICY IF EXISTS "Users can insert their own image analysis usage" ON public.image_analysis_usage;
DROP POLICY IF EXISTS "Users can update their own image analysis usage" ON public.image_analysis_usage;
DROP POLICY IF EXISTS "Users can read own image analysis usage" ON public.image_analysis_usage;
DROP POLICY IF EXISTS "Users can insert own image analysis usage" ON public.image_analysis_usage;
DROP POLICY IF EXISTS "Users can update own image analysis usage" ON public.image_analysis_usage;

CREATE POLICY "Users can view their own image analysis usage"
  ON public.image_analysis_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own image analysis usage"
  ON public.image_analysis_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own image analysis usage"
  ON public.image_analysis_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- ############################################################
-- FIX 3: token_usage — keep version WITH model_key column
--         Drop conflicting 3-param function signatures
-- ############################################################

-- Drop old 3-param versions (without model_key)
DROP FUNCTION IF EXISTS public.increment_token_usage(UUID, VARCHAR(50), BIGINT);
DROP FUNCTION IF EXISTS public.check_token_limits(UUID, VARCHAR(50), BIGINT, BIGINT);

-- Ensure model_key column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_usage' AND column_name = 'model_key' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.token_usage ADD COLUMN model_key VARCHAR(50);
    ALTER TABLE public.token_usage DROP CONSTRAINT IF EXISTS token_usage_user_id_model_tier_key;
    ALTER TABLE public.token_usage ADD CONSTRAINT token_usage_user_id_model_tier_model_key_key
      UNIQUE(user_id, model_tier, model_key);
  END IF;
END $$;

-- Recreate correct 4-param increment function
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
  SELECT * INTO v_current_record
  FROM public.token_usage
  WHERE user_id = p_user_id AND model_tier = p_model_tier AND model_key = p_model_key
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.token_usage (
      user_id, model_tier, model_key, tokens_used,
      daily_tokens_used, monthly_tokens_used, daily_reset_at, monthly_reset_at
    ) VALUES (
      p_user_id, p_model_tier, p_model_key, p_tokens,
      p_tokens, p_tokens, v_now + INTERVAL '1 day', v_now + INTERVAL '1 month'
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

  IF v_current_record.daily_reset_at < v_now THEN
    v_new_daily_tokens := p_tokens;
    UPDATE public.token_usage
    SET daily_tokens_used = p_tokens, daily_reset_at = v_now + INTERVAL '1 day', updated_at = v_now
    WHERE user_id = p_user_id AND model_tier = p_model_tier AND model_key = p_model_key;
  ELSE
    v_new_daily_tokens := v_current_record.daily_tokens_used + p_tokens;
    UPDATE public.token_usage
    SET daily_tokens_used = v_new_daily_tokens, updated_at = v_now
    WHERE user_id = p_user_id AND model_tier = p_model_tier AND model_key = p_model_key;
  END IF;

  IF v_current_record.monthly_reset_at < v_now THEN
    v_new_monthly_tokens := p_tokens;
    UPDATE public.token_usage
    SET monthly_tokens_used = p_tokens, monthly_reset_at = v_now + INTERVAL '1 month', updated_at = v_now
    WHERE user_id = p_user_id AND model_tier = p_model_tier AND model_key = p_model_key;
  ELSE
    v_new_monthly_tokens := v_current_record.monthly_tokens_used + p_tokens;
    UPDATE public.token_usage
    SET monthly_tokens_used = v_new_monthly_tokens, updated_at = v_now
    WHERE user_id = p_user_id AND model_tier = p_model_tier AND model_key = p_model_key;
  END IF;

  UPDATE public.token_usage
  SET tokens_used = tokens_used + p_tokens, updated_at = v_now
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

-- Recreate correct 5-param check function
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
  SELECT * INTO v_current_record
  FROM public.token_usage
  WHERE user_id = p_user_id AND model_tier = p_model_tier AND model_key = p_model_key;

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

  IF v_current_record.daily_reset_at < v_now THEN
    v_daily_remaining := p_daily_limit;
  ELSE
    v_daily_remaining := p_daily_limit - v_current_record.daily_tokens_used;
  END IF;

  IF v_current_record.monthly_reset_at < v_now THEN
    v_monthly_remaining := p_monthly_limit;
  ELSE
    v_monthly_remaining := p_monthly_limit - v_current_record.monthly_tokens_used;
  END IF;

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

-- Drop and recreate token_usage RLS policies
DROP POLICY IF EXISTS "Users can view their own token usage" ON public.token_usage;
DROP POLICY IF EXISTS "Users can insert their own token usage" ON public.token_usage;
DROP POLICY IF EXISTS "Users can update their own token usage" ON public.token_usage;

CREATE POLICY "Users can view their own token usage"
  ON public.token_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own token usage"
  ON public.token_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own token usage"
  ON public.token_usage FOR UPDATE
  USING (auth.uid() = user_id);

GRANT EXECUTE ON FUNCTION public.increment_token_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_token_limits TO authenticated;

-- ############################################################
-- FIX 4: customers & subscriptions tables (referenced by tavily/web_search functions)
-- ############################################################

CREATE TABLE IF NOT EXISTS public.customers (
  customer_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Drop old subscriptions table if it has uuid PK (wrong schema)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'subscriptions' AND table_schema = 'public'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND table_schema = 'public' AND column_name = 'subscription_id'
  ) THEN
    DROP TABLE public.subscriptions CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  subscription_id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES public.customers(customer_id),
  user_id TEXT,
  status TEXT NOT NULL,
  price_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  plan TEXT,
  scheduled_change_action TEXT,
  scheduled_change_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS plan TEXT;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can manage customers" ON public.customers;

CREATE POLICY "Users can read own subscription"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL TO service_role
  USING (true);

CREATE POLICY "Service role can manage customers"
  ON public.customers FOR ALL TO service_role
  USING (true);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON public.subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- ############################################################
-- FIX 5: claude_credits — add DROP POLICY IF EXISTS
-- ############################################################

DROP POLICY IF EXISTS "Users can read own claude credits" ON public.claude_credits;
DROP POLICY IF EXISTS "Users can insert own claude credits" ON public.claude_credits;
DROP POLICY IF EXISTS "Users can update own claude credits" ON public.claude_credits;

CREATE POLICY "Users can read own claude credits"
  ON public.claude_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own claude credits"
  ON public.claude_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own claude credits"
  ON public.claude_credits FOR UPDATE
  USING (auth.uid() = user_id);

-- ############################################################
-- FIX 6: image_generation_usage — add DROP POLICY IF EXISTS
-- ############################################################

DROP POLICY IF EXISTS "Users can read own image generation usage" ON public.image_generation_usage;
DROP POLICY IF EXISTS "Users can insert own image generation usage" ON public.image_generation_usage;
DROP POLICY IF EXISTS "Users can update own image generation usage" ON public.image_generation_usage;

CREATE POLICY "Users can read own image generation usage"
  ON public.image_generation_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own image generation usage"
  ON public.image_generation_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own image generation usage"
  ON public.image_generation_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- ############################################################
-- FIX 7: tavily_usage — add DROP POLICY IF EXISTS
-- ############################################################

DROP POLICY IF EXISTS "Users can read own tavily usage" ON public.tavily_usage;
DROP POLICY IF EXISTS "Users can insert own tavily usage" ON public.tavily_usage;
DROP POLICY IF EXISTS "Users can update own tavily usage" ON public.tavily_usage;

CREATE POLICY "Users can read own tavily usage"
  ON public.tavily_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tavily usage"
  ON public.tavily_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tavily usage"
  ON public.tavily_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- ############################################################
-- FIX 8: web_search_usage — add DROP POLICY IF EXISTS
-- ############################################################

DROP POLICY IF EXISTS "Users can read own web search usage" ON public.web_search_usage;
DROP POLICY IF EXISTS "Users can insert own web search usage" ON public.web_search_usage;
DROP POLICY IF EXISTS "Users can update own web search usage" ON public.web_search_usage;

CREATE POLICY "Users can read own web search usage"
  ON public.web_search_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own web search usage"
  ON public.web_search_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own web search usage"
  ON public.web_search_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- ############################################################
-- FIX 9: pro_user_summaries — add DROP POLICY IF EXISTS
-- ############################################################

DROP POLICY IF EXISTS "Users can view their own pro summary" ON public.pro_user_summaries;
DROP POLICY IF EXISTS "Users can insert their own pro summary" ON public.pro_user_summaries;
DROP POLICY IF EXISTS "Users can update their own pro summary" ON public.pro_user_summaries;

CREATE POLICY "Users can view their own pro summary"
  ON public.pro_user_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pro summary"
  ON public.pro_user_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pro summary"
  ON public.pro_user_summaries FOR UPDATE
  USING (auth.uid() = user_id);

-- ############################################################
-- FIX 10: user_summaries — add DROP POLICY IF EXISTS
-- ############################################################

DROP POLICY IF EXISTS "Users can view their own summary" ON public.user_summaries;
DROP POLICY IF EXISTS "Users can insert their own summary" ON public.user_summaries;
DROP POLICY IF EXISTS "Users can update their own summary" ON public.user_summaries;

CREATE POLICY "Users can view their own summary"
  ON public.user_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own summary"
  ON public.user_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own summary"
  ON public.user_summaries FOR UPDATE
  USING (auth.uid() = user_id);

-- ############################################################
-- FIX 11: gpt5_token_usage — add DROP POLICY IF EXISTS
-- ############################################################

DROP POLICY IF EXISTS "Users can view their own GPT-5 token usage" ON public.gpt5_token_usage;
DROP POLICY IF EXISTS "Users can insert their own GPT-5 token usage" ON public.gpt5_token_usage;
DROP POLICY IF EXISTS "Users can update their own GPT-5 token usage" ON public.gpt5_token_usage;

CREATE POLICY "Users can view their own GPT-5 token usage"
  ON public.gpt5_token_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own GPT-5 token usage"
  ON public.gpt5_token_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own GPT-5 token usage"
  ON public.gpt5_token_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- ############################################################
-- FIX 12: ni_token_usage — add DROP POLICY IF EXISTS
-- ############################################################

DROP POLICY IF EXISTS "Users can view their own token usage" ON public.ni_token_usage;
DROP POLICY IF EXISTS "Users can insert their own token usage" ON public.ni_token_usage;
DROP POLICY IF EXISTS "Users can update their own token usage" ON public.ni_token_usage;

CREATE POLICY "Users can view their own token usage"
  ON public.ni_token_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own token usage"
  ON public.ni_token_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own token usage"
  ON public.ni_token_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- ############################################################
-- FIX 13: chat.chat_usage — add DROP POLICY IF EXISTS
-- ############################################################

DROP POLICY IF EXISTS "Users can read own chat usage" ON chat.chat_usage;
DROP POLICY IF EXISTS "Users can insert own chat usage" ON chat.chat_usage;
DROP POLICY IF EXISTS "Users can update own chat usage" ON chat.chat_usage;

CREATE POLICY "Users can read own chat usage"
  ON chat.chat_usage FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chat usage"
  ON chat.chat_usage FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chat usage"
  ON chat.chat_usage FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ############################################################
-- FIX 14: public.conversations — clean up test policies + add DROP POLICY
-- ############################################################

-- Remove test policies that allow anyone to insert
DROP POLICY IF EXISTS "Users can insert conversations (test)" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert messages (test)" ON public.messages;

-- Recreate proper conversations policies
DROP POLICY IF EXISTS "Users can read own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Group members can read conversations" ON public.conversations;
DROP POLICY IF EXISTS "Group members can insert conversations" ON public.conversations;

CREATE POLICY "Users can read own conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own conversations"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON public.conversations FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own conversations"
  ON public.conversations FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ############################################################
-- FIX 15: public.messages — clean up + add DROP POLICY
-- ############################################################

DROP POLICY IF EXISTS "Users can read own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can read messages of own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Group members can read messages" ON public.messages;
DROP POLICY IF EXISTS "Group members can insert messages" ON public.messages;

CREATE POLICY "Users can read own messages"
  ON public.messages FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ############################################################
-- FIX 16: Drop duplicate public.chat_usage (should only exist in chat schema)
-- ############################################################

DROP POLICY IF EXISTS "Users can read own chat usage" ON public.chat_usage;
DROP POLICY IF EXISTS "Users can insert own chat usage" ON public.chat_usage;
DROP POLICY IF EXISTS "Users can update own chat usage" ON public.chat_usage;
DROP TABLE IF EXISTS public.chat_usage;

-- ############################################################
-- FIX 17: user_memory_summaries — add DROP POLICY IF EXISTS
-- ############################################################

DROP POLICY IF EXISTS "Users can read own memory summary" ON public.user_memory_summaries;
DROP POLICY IF EXISTS "Users can insert own memory summary" ON public.user_memory_summaries;
DROP POLICY IF EXISTS "Users can update own memory summary" ON public.user_memory_summaries;

CREATE POLICY "Users can read own memory summary"
  ON public.user_memory_summaries FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own memory summary"
  ON public.user_memory_summaries FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own memory summary"
  ON public.user_memory_summaries FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ############################################################
-- FIX 18: Grant execute on all public functions
-- ############################################################

GRANT EXECUTE ON FUNCTION public.get_or_reset_claude_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_claude_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_reset_image_generation_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_image_generation TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_reset_image_analysis_usage TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_image_analysis_credit TO authenticated;
GRANT EXECUTE ON FUNCTION check_image_analysis_limits_exhausted TO authenticated;
GRANT EXECUTE ON FUNCTION get_image_analysis_exhaustion_message TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_reset_gpt5_token_usage TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_gpt5_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION check_gpt5_limits_exhausted TO authenticated;
GRANT EXECUTE ON FUNCTION get_total_gpt5_remaining TO authenticated;
GRANT EXECUTE ON FUNCTION gpt5_get_next_available_model TO authenticated;
GRANT EXECUTE ON FUNCTION gpt5_exhaustion_message TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_reset_ni_token_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_ni_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_ni_limits_exhausted TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_total_ni_remaining TO authenticated;
GRANT EXECUTE ON FUNCTION public.ni_get_next_available_model TO authenticated;
GRANT EXECUTE ON FUNCTION public.ni_exhaustion_message TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_token_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_token_limits TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_reset_tavily_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_tavily_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_reset_web_search_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_web_search_usage TO authenticated;
GRANT EXECUTE ON FUNCTION chat.increment_chat_usage TO authenticated;
GRANT EXECUTE ON FUNCTION chat.get_usage_status TO authenticated;

-- ############################################################
-- FIX 19: tavily_usage & web_search_usage functions — UUID = TEXT mismatch
--         subscriptions.user_id is TEXT, p_user_id is UUID → cast needed
-- ############################################################

-- Fix get_or_reset_tavily_usage
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
  SELECT COALESCE(
    CASE WHEN s.status = 'active' THEN true ELSE false END,
    false
  ) INTO v_is_paid
  FROM subscriptions s
  WHERE s.user_id = p_user_id::text AND s.status = 'active'
  LIMIT 1;

  IF v_is_paid THEN
    v_daily_limit := NULL;
  ELSE
    v_daily_limit := 3;
  END IF;

  SELECT * INTO v_record
  FROM tavily_usage
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO tavily_usage (user_id, search_count, last_reset_at)
    VALUES (p_user_id, 0, NOW())
    RETURNING * INTO v_record;
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

-- Fix increment_tavily_usage
CREATE OR REPLACE FUNCTION public.increment_tavily_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_current_count INTEGER;
  v_daily_limit INTEGER;
  v_is_paid BOOLEAN;
BEGIN
  SELECT COALESCE(
    CASE WHEN s.status = 'active' THEN true ELSE false END,
    false
  ) INTO v_is_paid
  FROM subscriptions s
  WHERE s.user_id = p_user_id::text AND s.status = 'active'
  LIMIT 1;

  IF v_is_paid THEN
    UPDATE tavily_usage
    SET search_count = search_count + 1, updated_at = NOW()
    WHERE user_id = p_user_id;

    SELECT search_count INTO v_current_count
    FROM tavily_usage
    WHERE user_id = p_user_id;

    RETURN v_current_count;
  END IF;

  SELECT search_count INTO v_current_count
  FROM get_or_reset_tavily_usage(p_user_id)
  LIMIT 1;

  v_daily_limit := 3;

  IF v_current_count >= v_daily_limit THEN
    RETURN -1;
  END IF;

  UPDATE tavily_usage
  SET search_count = search_count + 1, updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_current_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix get_or_reset_web_search_usage
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
  SELECT COALESCE(
    CASE WHEN s.status = 'active' THEN 224 ELSE 5 END,
    5
  ) INTO v_daily_limit
  FROM subscriptions s
  WHERE s.user_id = p_user_id::text AND s.status = 'active'
  LIMIT 1;

  SELECT * INTO v_record
  FROM web_search_usage
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO web_search_usage (user_id, search_count, last_reset_at)
    VALUES (p_user_id, 0, NOW())
    RETURNING * INTO v_record;
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

-- Fix increment_web_search_usage
CREATE OR REPLACE FUNCTION public.increment_web_search_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_current_count INTEGER;
  v_daily_limit INTEGER;
BEGIN
  SELECT search_count INTO v_current_count
  FROM get_or_reset_web_search_usage(p_user_id)
  LIMIT 1;

  SELECT COALESCE(
    CASE WHEN s.status = 'active' THEN 224 ELSE 5 END,
    5
  ) INTO v_daily_limit
  FROM subscriptions s
  WHERE s.user_id = p_user_id::text AND s.status = 'active'
  LIMIT 1;

  IF v_current_count >= v_daily_limit THEN
    RETURN -1;
  END IF;

  UPDATE web_search_usage
  SET search_count = search_count + 1, updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_current_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ############################################################
-- DONE — All mismatches fixed
-- ############################################################
