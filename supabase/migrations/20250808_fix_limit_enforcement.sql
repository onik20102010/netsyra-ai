-- ──────────────────────────────────────────────────────────────────────
-- Fix limit enforcement: add SECURITY DEFINER, GRANT, and RLS policies
-- to all limit tables and RPC functions created by 20250807_create_all_limit_tables.sql.
--
-- PROBLEMS FIXED:
-- 1. RPC functions lacked SECURITY DEFINER → ran as authenticated user
--    with no table access → all RPCs failed → fallbacks returned allowed=true.
-- 2. New tables lacked GRANT statements → authenticated role couldn't
--    access them even via fallback direct queries.
-- 3. No RLS policies → security risk (any user could read/write any row).
--
-- This migration is safe to re-run.
-- ──────────────────────────────────────────────────────────────────────

BEGIN;

-- ============================================================
-- 1. GRANT table access to authenticated role
-- ============================================================
-- The earlier `grant all on all tables in schema chat` only applied to
-- tables existing at that time. New tables need explicit grants.

GRANT SELECT, INSERT, UPDATE, DELETE ON chat.user_message_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat.token_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat.web_search_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat.image_analysis_usage TO authenticated;

-- Grant sequence usage for web_search_usage (has gen_random_uuid default, no sequence needed)
-- But grant on all sequences just in case
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA chat TO authenticated;

-- ============================================================
-- 2. Enable RLS + create policies on all limit tables
-- ============================================================

-- ── chat.user_message_usage ──
ALTER TABLE chat.user_message_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own message usage" ON chat.user_message_usage;
DROP POLICY IF EXISTS "Users can insert own message usage" ON chat.user_message_usage;
DROP POLICY IF EXISTS "Users can update own message usage" ON chat.user_message_usage;

CREATE POLICY "Users can read own message usage"
  ON chat.user_message_usage FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own message usage"
  ON chat.user_message_usage FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own message usage"
  ON chat.user_message_usage FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── chat.token_usage ──
ALTER TABLE chat.token_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own token usage" ON chat.token_usage;
DROP POLICY IF EXISTS "Users can insert own token usage" ON chat.token_usage;
DROP POLICY IF EXISTS "Users can update own token usage" ON chat.token_usage;

CREATE POLICY "Users can read own token usage"
  ON chat.token_usage FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own token usage"
  ON chat.token_usage FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own token usage"
  ON chat.token_usage FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── chat.web_search_usage ──
ALTER TABLE chat.web_search_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own web search usage" ON chat.web_search_usage;
DROP POLICY IF EXISTS "Users can insert own web search usage" ON chat.web_search_usage;

CREATE POLICY "Users can read own web search usage"
  ON chat.web_search_usage FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own web search usage"
  ON chat.web_search_usage FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ── chat.image_analysis_usage ──
ALTER TABLE chat.image_analysis_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own image analysis usage" ON chat.image_analysis_usage;
DROP POLICY IF EXISTS "Users can insert own image analysis usage" ON chat.image_analysis_usage;
DROP POLICY IF EXISTS "Users can update own image analysis usage" ON chat.image_analysis_usage;

CREATE POLICY "Users can read own image analysis usage"
  ON chat.image_analysis_usage FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own image analysis usage"
  ON chat.image_analysis_usage FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own image analysis usage"
  ON chat.image_analysis_usage FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 3. Recreate ALL RPC functions with SECURITY DEFINER
--    (bypasses RLS so the functions can atomically check+increment)
-- ============================================================

-- ── RPC 1: check_and_increment_message_usage ──
CREATE OR REPLACE FUNCTION chat.check_and_increment_message_usage(
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = chat, public
AS $$
DECLARE
    v_messages_used INTEGER;
    v_reset_at      TIMESTAMPTZ;
    v_new_count     INTEGER;
    v_new_reset     TIMESTAMPTZ;
BEGIN
    SELECT messages_used, reset_at
      INTO v_messages_used, v_reset_at
      FROM chat.user_message_usage
     WHERE user_id = p_user_id AND model_tier = p_model_tier
     FOR UPDATE;

    IF v_messages_used IS NULL THEN
        v_new_count := 1;
        v_new_reset := now() + interval '24 hours';
        INSERT INTO chat.user_message_usage (user_id, model_tier, messages_used, reset_at)
        VALUES (p_user_id, p_model_tier, v_new_count, v_new_reset);
        RETURN QUERY SELECT true, v_new_count, (p_message_limit - v_new_count), v_new_reset;
        RETURN;
    END IF;

    IF now() >= v_reset_at THEN
        v_new_count := 1;
        v_new_reset := now() + interval '24 hours';
        UPDATE chat.user_message_usage
           SET messages_used = v_new_count, reset_at = v_new_reset, updated_at = now()
         WHERE user_id = p_user_id AND model_tier = p_model_tier;
        RETURN QUERY SELECT true, v_new_count, (p_message_limit - v_new_count), v_new_reset;
        RETURN;
    END IF;

    IF v_messages_used >= p_message_limit THEN
        RETURN QUERY SELECT false, v_messages_used, 0, (v_reset_at + interval '24 hours');
        RETURN;
    END IF;

    v_new_count := v_messages_used + 1;
    UPDATE chat.user_message_usage
       SET messages_used = v_new_count, updated_at = now()
     WHERE user_id = p_user_id AND model_tier = p_model_tier;

    RETURN QUERY SELECT true, v_new_count, (p_message_limit - v_new_count), v_reset_at;
END;
$$;

-- ── RPC 2: check_token_limits ──
CREATE OR REPLACE FUNCTION chat.check_token_limits(
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = chat, public
AS $$
DECLARE
    v_daily_used    INTEGER;
    v_monthly_used  INTEGER;
    v_daily_reset   TIMESTAMPTZ;
    v_monthly_reset TIMESTAMPTZ;
BEGIN
    SELECT tokens_used_today, tokens_used_month, daily_reset_at, monthly_reset_at
      INTO v_daily_used, v_monthly_used, v_daily_reset, v_monthly_reset
      FROM chat.token_usage
     WHERE user_id = p_user_id AND model_key = p_model_key;

    IF v_daily_used IS NULL THEN
        RETURN QUERY SELECT true, 0, p_daily_limit, 0, p_monthly_limit,
            (now() + interval '24 hours'), (now() + interval '30 days');
        RETURN;
    END IF;

    IF now() >= v_daily_reset THEN
        v_daily_used := 0;
    END IF;

    IF now() >= v_monthly_reset THEN
        v_monthly_used := 0;
    END IF;

    IF v_daily_used >= p_daily_limit OR v_monthly_used >= p_monthly_limit THEN
        RETURN QUERY SELECT false, v_daily_used, 0, v_monthly_used, 0,
            v_daily_reset, v_monthly_reset;
        RETURN;
    END IF;

    RETURN QUERY SELECT true, v_daily_used, (p_daily_limit - v_daily_used),
        v_monthly_used, (p_monthly_limit - v_monthly_used),
        v_daily_reset, v_monthly_reset;
END;
$$;

-- ── RPC 3: increment_token_usage ──
CREATE OR REPLACE FUNCTION chat.increment_token_usage(
    p_user_id       UUID,
    p_model_key     TEXT,
    p_tokens_used   INTEGER,
    p_daily_limit   INTEGER,
    p_monthly_limit INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = chat, public
AS $$
DECLARE
    v_daily_used    INTEGER;
    v_monthly_used  INTEGER;
    v_daily_reset   TIMESTAMPTZ;
    v_monthly_reset TIMESTAMPTZ;
BEGIN
    SELECT tokens_used_today, tokens_used_month, daily_reset_at, monthly_reset_at
      INTO v_daily_used, v_monthly_used, v_daily_reset, v_monthly_reset
      FROM chat.token_usage
     WHERE user_id = p_user_id AND model_key = p_model_key
     FOR UPDATE;

    IF v_daily_used IS NULL THEN
        INSERT INTO chat.token_usage (user_id, model_key, tokens_used_today, tokens_used_month,
            daily_reset_at, monthly_reset_at)
        VALUES (p_user_id, p_model_key, p_tokens_used, p_tokens_used,
            now() + interval '24 hours', now() + interval '30 days');
        RETURN;
    END IF;

    IF now() >= v_daily_reset THEN
        v_daily_used := 0;
        v_daily_reset := now() + interval '24 hours';
    END IF;

    IF now() >= v_monthly_reset THEN
        v_monthly_used := 0;
        v_monthly_reset := now() + interval '30 days';
    END IF;

    UPDATE chat.token_usage
       SET tokens_used_today = v_daily_used + p_tokens_used,
           tokens_used_month = v_monthly_used + p_tokens_used,
           daily_reset_at    = v_daily_reset,
           monthly_reset_at  = v_monthly_reset,
           updated_at        = now()
     WHERE user_id = p_user_id AND model_key = p_model_key;
END;
$$;

-- ── RPC 4: check_web_search_limit ──
CREATE OR REPLACE FUNCTION chat.check_web_search_limit(
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = chat, public
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT count(*)
      INTO v_count
      FROM chat.web_search_usage
     WHERE user_id = p_user_id
       AND search_type = p_search_type
       AND created_at >= (now() - (p_window_hours || ' hours')::interval);

    IF v_count >= p_limit_val THEN
        RETURN QUERY SELECT false, v_count, 0, p_limit_val, p_window_hours;
    ELSE
        RETURN QUERY SELECT true, v_count, (p_limit_val - v_count), p_limit_val, p_window_hours;
    END IF;
END;
$$;

-- ── RPC 5: record_web_search ──
CREATE OR REPLACE FUNCTION chat.record_web_search(
    p_user_id     UUID,
    p_search_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = chat, public
AS $$
BEGIN
    INSERT INTO chat.web_search_usage (user_id, search_type)
    VALUES (p_user_id, p_search_type);
END;
$$;

-- ── RPC 6: check_image_analysis_limit ──
CREATE OR REPLACE FUNCTION chat.check_image_analysis_limit(
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = chat, public
AS $$
DECLARE
    v_daily_count   INTEGER;
    v_monthly_count INTEGER;
    v_daily_reset   TIMESTAMPTZ;
    v_monthly_reset TIMESTAMPTZ;
BEGIN
    SELECT daily_count, monthly_count, last_daily_reset, last_monthly_reset
      INTO v_daily_count, v_monthly_count, v_daily_reset, v_monthly_reset
      FROM chat.image_analysis_usage
     WHERE user_id = p_user_id;

    IF v_daily_count IS NULL THEN
        RETURN QUERY SELECT true, 0, p_daily_limit, 0, GREATEST(p_monthly_limit, 0);
        RETURN;
    END IF;

    IF now() >= v_daily_reset THEN
        v_daily_count := 0;
    END IF;

    IF p_monthly_limit > 0 AND now() >= v_monthly_reset THEN
        v_monthly_count := 0;
    END IF;

    IF v_daily_count >= p_daily_limit THEN
        RETURN QUERY SELECT false, v_daily_count, 0, v_monthly_count, GREATEST(p_monthly_limit - v_monthly_count, 0);
        RETURN;
    END IF;

    IF p_monthly_limit > 0 AND v_monthly_count >= p_monthly_limit THEN
        RETURN QUERY SELECT false, v_daily_count, (p_daily_limit - v_daily_count), v_monthly_count, 0;
        RETURN;
    END IF;

    RETURN QUERY SELECT true, v_daily_count, (p_daily_limit - v_daily_count),
        v_monthly_count, GREATEST(p_monthly_limit - v_monthly_count, 0);
END;
$$;

-- ── RPC 7: increment_image_analysis_usage ──
CREATE OR REPLACE FUNCTION chat.increment_image_analysis_usage(
    p_user_id        UUID,
    p_daily_limit    INTEGER,
    p_monthly_limit  INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = chat, public
AS $$
DECLARE
    v_daily_count   INTEGER;
    v_monthly_count INTEGER;
    v_daily_reset   TIMESTAMPTZ;
    v_monthly_reset TIMESTAMPTZ;
BEGIN
    SELECT daily_count, monthly_count, last_daily_reset, last_monthly_reset
      INTO v_daily_count, v_monthly_count, v_daily_reset, v_monthly_reset
      FROM chat.image_analysis_usage
     WHERE user_id = p_user_id
     FOR UPDATE;

    IF v_daily_count IS NULL THEN
        INSERT INTO chat.image_analysis_usage (user_id, daily_count, monthly_count,
            daily_limit, monthly_limit, last_daily_reset, last_monthly_reset)
        VALUES (p_user_id, 1, 1, p_daily_limit, p_monthly_limit,
            now(), now());
        RETURN;
    END IF;

    IF now() >= v_daily_reset THEN
        v_daily_count := 0;
        v_daily_reset := now();
    END IF;

    IF p_monthly_limit > 0 AND now() >= (v_monthly_reset + interval '30 days') THEN
        v_monthly_count := 0;
        v_monthly_reset := now();
    END IF;

    UPDATE chat.image_analysis_usage
       SET daily_count        = v_daily_count + 1,
           monthly_count      = v_monthly_count + 1,
           daily_limit        = p_daily_limit,
           monthly_limit      = p_monthly_limit,
           last_daily_reset   = v_daily_reset,
           last_monthly_reset = v_monthly_reset,
           updated_at         = now()
     WHERE user_id = p_user_id;
END;
$$;

-- ============================================================
-- 4. GRANT EXECUTE on all RPC functions
-- ============================================================
GRANT EXECUTE ON FUNCTION chat.check_and_increment_message_usage TO authenticated;
GRANT EXECUTE ON FUNCTION chat.check_token_limits TO authenticated;
GRANT EXECUTE ON FUNCTION chat.increment_token_usage TO authenticated;
GRANT EXECUTE ON FUNCTION chat.check_web_search_limit TO authenticated;
GRANT EXECUTE ON FUNCTION chat.record_web_search TO authenticated;
GRANT EXECUTE ON FUNCTION chat.check_image_analysis_limit TO authenticated;
GRANT EXECUTE ON FUNCTION chat.increment_image_analysis_usage TO authenticated;

COMMIT;
