-- ──────────────────────────────────────────────────────────────────────
-- Expose chat-schema limit tables + RPCs via public schema wrappers.
--
-- PROBLEM:
--   PostgREST only exposes schemas listed in its db-schemas config.
--   On Supabase Cloud, only `public` and `graphql_public` are exposed
--   by default. The `chat` schema is NOT exposed, so every call to
--   chat-schema tables/RPCs via the Supabase JS client fails with:
--     PGRST106: Invalid schema: chat
--   This means limit enforcement silently fails — the counter never
--   increments and always returns 0/N.
--
-- SOLUTION:
--   1. Rename old incompatible `public` tables out of the way
--      (they have different column structures from the new chat tables)
--   2. Drop old `public` RPC functions (they have different signatures)
--   3. Create wrapper VIEWS in `public` that delegate to `chat` schema
--   4. Create wrapper RPC FUNCTIONS in `public` with the same signatures
--      as the chat-schema functions
--
--   PostgREST always exposes `public`, so all calls work without
--   dashboard changes. No application code changes needed.
--
-- This migration is safe to re-run.
-- ──────────────────────────────────────────────────────────────────────

BEGIN;

-- ============================================================
-- 1. Rename old public tables out of the way (preserve data)
-- ============================================================
-- These old tables have incompatible structures (different columns,
-- different primary keys) and are superseded by the chat-schema versions.

-- ── public.token_usage → public._old_token_usage ──
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'token_usage'
      AND table_type = 'BASE TABLE'
  ) THEN
    ALTER TABLE public.token_usage RENAME TO _old_token_usage;
    RAISE NOTICE 'Renamed public.token_usage → public._old_token_usage';
  END IF;
END $$;

-- ── public.web_search_usage → public._old_web_search_usage ──
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'web_search_usage'
      AND table_type = 'BASE TABLE'
  ) THEN
    ALTER TABLE public.web_search_usage RENAME TO _old_web_search_usage;
    RAISE NOTICE 'Renamed public.web_search_usage → public._old_web_search_usage';
  END IF;
END $$;

-- ── public.image_analysis_usage → public._old_image_analysis_usage ──
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'image_analysis_usage'
      AND table_type = 'BASE TABLE'
  ) THEN
    ALTER TABLE public.image_analysis_usage RENAME TO _old_image_analysis_usage;
    RAISE NOTICE 'Renamed public.image_analysis_usage → public._old_image_analysis_usage';
  END IF;
END $$;

-- ============================================================
-- 2. Drop old public RPC functions (incompatible signatures)
-- ============================================================
-- Old functions have different parameter counts/types and return JSONB
-- instead of TABLE. They must be dropped before creating wrappers with
-- the same names but correct signatures.

-- Old public.check_token_limits(UUID, VARCHAR, VARCHAR, BIGINT, BIGINT) → JSONB
DROP FUNCTION IF EXISTS public.check_token_limits(UUID, VARCHAR, VARCHAR, BIGINT, BIGINT);

-- Old public.increment_token_usage(UUID, VARCHAR, VARCHAR, BIGINT) → JSONB
DROP FUNCTION IF EXISTS public.increment_token_usage(UUID, VARCHAR, VARCHAR, BIGINT);

-- Old public.count_web_searches_in_window(UUID, INTEGER) → INTEGER
DROP FUNCTION IF EXISTS public.count_web_searches_in_window(UUID, INTEGER);

-- Old public.cleanup_old_web_search_usage(INTEGER) → INTEGER
DROP FUNCTION IF EXISTS public.cleanup_old_web_search_usage(INTEGER);

-- Old public.get_or_reset_web_search_usage(UUID)
DROP FUNCTION IF EXISTS public.get_or_reset_web_search_usage(UUID);

-- Old public.increment_web_search_usage(UUID)
DROP FUNCTION IF EXISTS public.increment_web_search_usage(UUID);

-- Also drop any existing wrapper functions from a previous run
DROP FUNCTION IF EXISTS public.check_and_increment_message_usage(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.check_token_limits(UUID, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.increment_token_usage(UUID, TEXT, INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.check_web_search_limit(UUID, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.record_web_search(UUID, TEXT);
DROP FUNCTION IF EXISTS public.check_image_analysis_limit(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.increment_image_analysis_usage(UUID, INTEGER, INTEGER);

-- ============================================================
-- 3. Drop old views if they exist (from a previous partial run)
-- ============================================================
DROP VIEW IF EXISTS public.user_message_usage;
DROP VIEW IF EXISTS public.token_usage;
DROP VIEW IF EXISTS public.web_search_usage;
DROP VIEW IF EXISTS public.image_analysis_usage;

-- ============================================================
-- 4. Create wrapper VIEWS in public schema
-- ============================================================
-- Auto-updatable views allow INSERT/UPDATE/DELETE through the view.

CREATE VIEW public.user_message_usage AS
  SELECT * FROM chat.user_message_usage;

CREATE VIEW public.token_usage AS
  SELECT * FROM chat.token_usage;

CREATE VIEW public.web_search_usage AS
  SELECT * FROM chat.web_search_usage;

CREATE VIEW public.image_analysis_usage AS
  SELECT * FROM chat.image_analysis_usage;

-- Grant access to the views
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_message_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.token_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.web_search_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_analysis_usage TO authenticated;

-- ============================================================
-- 5. Create wrapper RPC FUNCTIONS in public schema
-- ============================================================
-- Each wrapper has the same signature as the chat-schema function
-- and delegates via SELECT. SECURITY DEFINER runs with owner privileges.

-- ── Wrapper 1: check_and_increment_message_usage ──
CREATE OR REPLACE FUNCTION public.check_and_increment_message_usage(
    p_user_id       UUID,
    p_model_tier    TEXT,
    p_message_limit INTEGER
)
RETURNS TABLE(
    allowed            BOOLEAN,
    messages_sent      INTEGER,
    messages_remaining INTEGER,
    resets_at          TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = chat, public
AS $$
    SELECT * FROM chat.check_and_increment_message_usage(
        p_user_id, p_model_tier, p_message_limit
    );
$$;

-- ── Wrapper 2: check_token_limits ──
CREATE OR REPLACE FUNCTION public.check_token_limits(
    p_user_id       UUID,
    p_model_key     TEXT,
    p_daily_limit   INTEGER,
    p_monthly_limit INTEGER
)
RETURNS TABLE(
    allowed             BOOLEAN,
    daily_used          INTEGER,
    daily_remaining     INTEGER,
    monthly_used        INTEGER,
    monthly_remaining   INTEGER,
    daily_reset_at      TIMESTAMPTZ,
    monthly_reset_at    TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = chat, public
AS $$
    SELECT * FROM chat.check_token_limits(
        p_user_id, p_model_key, p_daily_limit, p_monthly_limit
    );
$$;

-- ── Wrapper 3: increment_token_usage ──
CREATE OR REPLACE FUNCTION public.increment_token_usage(
    p_user_id       UUID,
    p_model_key     TEXT,
    p_tokens_used   INTEGER,
    p_daily_limit   INTEGER,
    p_monthly_limit INTEGER
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = chat, public
AS $$
    SELECT chat.increment_token_usage(
        p_user_id, p_model_key, p_tokens_used, p_daily_limit, p_monthly_limit
    );
$$;

-- ── Wrapper 4: check_web_search_limit ──
CREATE OR REPLACE FUNCTION public.check_web_search_limit(
    p_user_id      UUID,
    p_search_type  TEXT,
    p_limit_val    INTEGER,
    p_window_hours INTEGER
)
RETURNS TABLE(
    allowed       BOOLEAN,
    used          INTEGER,
    remaining     INTEGER,
    limit_val     INTEGER,
    window_hours  INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = chat, public
AS $$
    SELECT * FROM chat.check_web_search_limit(
        p_user_id, p_search_type, p_limit_val, p_window_hours
    );
$$;

-- ── Wrapper 5: record_web_search ──
CREATE OR REPLACE FUNCTION public.record_web_search(
    p_user_id     UUID,
    p_search_type TEXT
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = chat, public
AS $$
    SELECT chat.record_web_search(p_user_id, p_search_type);
$$;

-- ── Wrapper 6: check_image_analysis_limit ──
CREATE OR REPLACE FUNCTION public.check_image_analysis_limit(
    p_user_id        UUID,
    p_daily_limit    INTEGER,
    p_monthly_limit  INTEGER
)
RETURNS TABLE(
    allowed                  BOOLEAN,
    daily_used               INTEGER,
    daily_remaining          INTEGER,
    monthly_used             INTEGER,
    monthly_remaining        INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = chat, public
AS $$
    SELECT * FROM chat.check_image_analysis_limit(
        p_user_id, p_daily_limit, p_monthly_limit
    );
$$;

-- ── Wrapper 7: increment_image_analysis_usage ──
CREATE OR REPLACE FUNCTION public.increment_image_analysis_usage(
    p_user_id        UUID,
    p_daily_limit    INTEGER,
    p_monthly_limit  INTEGER
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = chat, public
AS $$
    SELECT chat.increment_image_analysis_usage(
        p_user_id, p_daily_limit, p_monthly_limit
    );
$$;

-- ============================================================
-- 6. GRANT EXECUTE on all wrapper functions
-- ============================================================
GRANT EXECUTE ON FUNCTION public.check_and_increment_message_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_token_limits TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_token_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_web_search_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_web_search TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_image_analysis_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_image_analysis_usage TO authenticated;

COMMIT;
