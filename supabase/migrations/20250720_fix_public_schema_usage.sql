-- Fix usage table to use public schema and clean up corrupted data
-- Run this in Supabase SQL Editor

-- Create usage table in public schema if not exists
CREATE TABLE IF NOT EXISTS public.chat_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_tier text NOT NULL,
  messages_used int NOT NULL DEFAULT 0,
  reset_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  PRIMARY KEY (user_id, model_tier)
);

-- Enable RLS
ALTER TABLE public.chat_usage ENABLE ROW LEVEL SECURITY;

-- Drop old policies first (safe re-run)
DROP POLICY IF EXISTS "Users can read own chat usage" ON public.chat_usage;
DROP POLICY IF EXISTS "Users can insert own chat usage" ON public.chat_usage;
DROP POLICY IF EXISTS "Users can update own chat usage" ON public.chat_usage;

-- Recreate policies
CREATE POLICY "Users can read own chat usage"
  ON public.chat_usage FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chat usage"
  ON public.chat_usage FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chat usage"
  ON public.chat_usage FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Clean up corrupted data (negative counts, future reset dates)
DELETE FROM public.chat_usage 
WHERE messages_used < 0 
   OR reset_at > now() + interval '25 hours';

-- Reset any expired usage records
UPDATE public.chat_usage 
SET messages_used = 0, 
    reset_at = now() + interval '24 hours'
WHERE reset_at < now();

-- Create index for speed
CREATE INDEX IF NOT EXISTS idx_chat_usage_user_tier ON public.chat_usage(user_id, model_tier);

-- Add comment
COMMENT ON TABLE public.chat_usage IS 'Per-user per-tier message usage tracking with 24-hour reset (TESTING: 2 messages per tier)';
