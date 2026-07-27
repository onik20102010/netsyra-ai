-- Remove duplicate public.chat_usage table
-- All usage tracking should use chat.chat_usage where the increment_chat_usage RPC lives

-- Drop policies and table from public schema (safe re-run)
DROP POLICY IF EXISTS "Users can read own chat usage" ON public.chat_usage;
DROP POLICY IF EXISTS "Users can insert own chat usage" ON public.chat_usage;
DROP POLICY IF EXISTS "Users can update own chat usage" ON public.chat_usage;
DROP TABLE IF EXISTS public.chat_usage;
