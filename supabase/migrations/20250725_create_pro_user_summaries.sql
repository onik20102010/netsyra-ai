-- ============================================================
-- Pro User Summary Table for Premium Plan
-- Stores enhanced 1000-character user behavior summaries with detailed analysis
-- ============================================================

-- Table
CREATE TABLE IF NOT EXISTS public.pro_user_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  detailed_profile JSONB NOT NULL DEFAULT '{}',
  interaction_patterns JSONB NOT NULL DEFAULT '{}',
  project_context JSONB NOT NULL DEFAULT '{}',
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_count_at_update INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies (drop first for safe re-run)
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pro_user_summaries_user_id ON public.pro_user_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_pro_user_summaries_last_updated ON public.pro_user_summaries(last_updated_at);
