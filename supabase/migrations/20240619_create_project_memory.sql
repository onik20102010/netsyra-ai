-- Create project_memory table for persistent project memory
CREATE TABLE IF NOT EXISTS project_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  memory JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_memory_user_project ON project_memory(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_project_memory_updated_at ON project_memory(updated_at DESC);

-- Add RLS policies
ALTER TABLE project_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own project memory"
  ON project_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project memory"
  ON project_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project memory"
  ON project_memory FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project memory"
  ON project_memory FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_project_memory_updated_at_trigger
  BEFORE UPDATE ON project_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_project_memory_updated_at();
