-- Create chat_summaries table for context compression
CREATE TABLE IF NOT EXISTS chat_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL,
  summary JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chat_summaries_chat_id ON chat_summaries(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_summaries_created_at ON chat_summaries(created_at DESC);

-- Add RLS policies
ALTER TABLE chat_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat summaries"
  ON chat_summaries FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM chats WHERE id = chat_summaries.chat_id
  ));

CREATE POLICY "Users can insert their own chat summaries"
  ON chat_summaries FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM chats WHERE id = chat_summaries.chat_id
  ));

CREATE POLICY "Users can update their own chat summaries"
  ON chat_summaries FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM chats WHERE id = chat_summaries.chat_id
  ));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_chat_summaries_updated_at_trigger
  BEFORE UPDATE ON chat_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_summaries_updated_at();
