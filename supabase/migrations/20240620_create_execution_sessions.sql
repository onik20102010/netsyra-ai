-- Create execution_sessions table
CREATE TABLE IF NOT EXISTS execution_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  current_step TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on project_id
CREATE INDEX IF NOT EXISTS idx_execution_sessions_project_id ON execution_sessions(project_id);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_execution_sessions_user_id ON execution_sessions(user_id);

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_execution_sessions_status ON execution_sessions(status);

-- Create index on started_at for recent sessions
CREATE INDEX IF NOT EXISTS idx_execution_sessions_started_at ON execution_sessions(started_at DESC);

-- Create execution_events table
CREATE TABLE IF NOT EXISTS execution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES execution_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('understanding', 'analysis', 'planning', 'execution', 'validation', 'repair', 'verification', 'completion')),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details TEXT,
  metadata JSONB,
  parent_id UUID REFERENCES execution_events(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on session_id
CREATE INDEX IF NOT EXISTS idx_execution_events_session_id ON execution_events(session_id);

-- Create index on type
CREATE INDEX IF NOT EXISTS idx_execution_events_type ON execution_events(type);

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_execution_events_status ON execution_events(status);

-- Create index on timestamp for chronological ordering
CREATE INDEX IF NOT EXISTS idx_execution_events_timestamp ON execution_events(timestamp DESC);

-- Create index on parent_id for event hierarchy
CREATE INDEX IF NOT EXISTS idx_execution_events_parent_id ON execution_events(parent_id);

-- Enable row level security
ALTER TABLE execution_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for execution_sessions
CREATE POLICY "Users can view their own execution sessions"
  ON execution_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own execution sessions"
  ON execution_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own execution sessions"
  ON execution_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for execution_events
CREATE POLICY "Users can view events from their own sessions"
  ON execution_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM execution_sessions
      WHERE execution_sessions.id = execution_events.session_id
      AND execution_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create events for their own sessions"
  ON execution_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM execution_sessions
      WHERE execution_sessions.id = execution_events.session_id
      AND execution_sessions.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_execution_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER execution_sessions_updated_at
  BEFORE UPDATE ON execution_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_execution_sessions_updated_at();
