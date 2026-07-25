-- ============================================================
-- Pro Conversation Summary Table for Premium Plan
-- Stores chat-specific incremental summaries with detailed analysis
-- ============================================================

-- Table
CREATE TABLE IF NOT EXISTS public.pro_conversation_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  user_overview TEXT NOT NULL DEFAULT '',
  likes_dislikes TEXT NOT NULL DEFAULT '',
  interests TEXT NOT NULL DEFAULT '',
  frequent_topics JSONB NOT NULL DEFAULT '{}',
  direct_requests JSONB NOT NULL DEFAULT '[]',
  message_count INTEGER NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.pro_conversation_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversation summaries"
  ON public.pro_conversation_summaries FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM conversations WHERE id = conversation_id));

CREATE POLICY "Users can insert their own conversation summaries"
  ON public.pro_conversation_summaries FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM conversations WHERE id = conversation_id));

CREATE POLICY "Users can update their own conversation summaries"
  ON public.pro_conversation_summaries FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM conversations WHERE id = conversation_id));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pro_conversation_summaries_conversation_id ON public.pro_conversation_summaries(conversation_id);
CREATE INDEX IF NOT EXISTS idx_pro_conversation_summaries_last_updated ON public.pro_conversation_summaries(last_updated_at);
