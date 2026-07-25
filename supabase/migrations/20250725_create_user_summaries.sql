-- ============================================================
-- User Summary Table for Free Plan
-- Stores 500-character user behavior summaries across all chats
-- ============================================================

-- Table
CREATE TABLE IF NOT EXISTS public.user_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  interaction_counts JSONB NOT NULL DEFAULT '{}',
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_count_at_update INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.user_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own summary"
  ON public.user_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own summary"
  ON public.user_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own summary"
  ON public.user_summaries FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_summaries_user_id ON public.user_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_summaries_last_updated ON public.user_summaries(last_updated_at);
