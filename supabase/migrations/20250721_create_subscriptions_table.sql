-- Subscriptions table is created by supabase-migrations/create_paddle_tables.sql
-- with the correct schema (subscription_id TEXT PRIMARY KEY, customer_id FK, etc.)
-- This migration is a no-op to avoid creating a conflicting table.
-- If the old table with uuid PK was already created, drop it so the correct one can be used.
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
