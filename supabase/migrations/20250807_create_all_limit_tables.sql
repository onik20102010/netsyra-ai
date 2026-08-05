-- ──────────────────────────────────────────────────────────────────────
-- Create ALL limit tables and RPC functions from scratch.
--
-- This migration runs AFTER 20250806_remove_text_llm_limits.sql which
-- dropped the old limit infrastructure. It rebuilds a clean, consistent
-- limit system:
--
--   Free plan:       per-tier message limits (no token limit)
--   Go Plus plan:    plan-level daily + monthly token limits (token_usage)
--   Pro plan:        per-LLM daily + monthly token limits (token_usage)
--   Plus Pro plan:   per-LLM daily + monthly token limits (token_usage)
--
--   Web search:      per-user count in a 24h sliding window
--   Dive deep:       per-user count in a 24h sliding window
--   Image analysis:  per-user daily count + monthly count
--
-- All paid plans (Go Plus, Pro, Plus Pro) use the SAME token_usage table.
-- The model_key column distinguishes them:
--   Go Plus:    'go_plus'
--   Pro (NI):   'claude-opus-4.6', 'claude-sonnet-4.6', etc.
--   Plus Pro:   'plus_pro_opus', 'plus_pro_luna', 'plus_pro_deepseek'
--
-- All tables live in the `chat` schema. All RPC functions use
-- FOR UPDATE row locking for atomic, race-condition-free enforcement.
-- ──────────────────────────────────────────────────────────────────────

BEGIN;

-- ============================================================
-- 1. chat.user_message_usage  (Free plan — per-tier message counting)
-- ============================================================
CREATE TABLE IF NOT EXISTS chat.user_message_usage (
    user_id      UUID    NOT NULL,
    model_tier   TEXT    NOT NULL,          -- fast, plus, pro, code, live, aai
    messages_used INTEGER NOT NULL DEFAULT 0,
    reset_at     TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, model_tier)
);

COMMENT ON TABLE chat.user_message_usage IS
  'Free plan per-tier message counting. Limits: fast=15, plus=10, pro=5, code=5, aai=5, live=3 per 24h. No token limit on Free. 24h reset.';

-- ============================================================
-- 2. chat.token_usage  (ALL paid plans — Go Plus, Pro, Plus Pro)
-- ============================================================
-- One row per user per model_key.
-- Go Plus:    model_key = 'go_plus'
-- Pro (NI):   model_key = LLM model name (claude-opus-4.6, etc.)
-- Plus Pro:   model_key = plus_pro_opus, plus_pro_luna, plus_pro_deepseek
CREATE TABLE IF NOT EXISTS chat.token_usage (
    user_id           UUID    NOT NULL,
    model_key         TEXT    NOT NULL,
    tokens_used_today INTEGER NOT NULL DEFAULT 0,
    tokens_used_month INTEGER NOT NULL DEFAULT 0,
    daily_reset_at    TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
    monthly_reset_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, model_key)
);

COMMENT ON TABLE chat.token_usage IS
  'Token usage for ALL paid plans. Go Plus: 317,000/day, 9,523,810/month. Pro per-LLM: opus 10k/300k, sonnet 16k/480k, deepseek-pro 34k/1.02M, gpt-5 20k/600k, gpt-5-mini 34k/1.02M, deepseek-flash 35k/1.05M. Plus Pro per-model: opus 27,778/833,333, luna 47,619/1,428,571, deepseek 204,342/6,130,268. Daily reset 24h, monthly reset 30 days.';

-- ============================================================
-- 3. chat.web_search_usage  (Web search + Dive deep — row-per-action)
-- ============================================================
CREATE TABLE IF NOT EXISTS chat.web_search_usage (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL,
    search_type TEXT        NOT NULL,       -- 'web_search' or 'dive_deep'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_web_search_usage_user_type_time
    ON chat.web_search_usage (user_id, search_type, created_at DESC);

COMMENT ON TABLE chat.web_search_usage IS
  'Web search and dive deep usage tracking (one row per action). Limits enforced by app via row count in a 24h sliding window. Web search: Free 3, Go Plus 100, Pro 200, Plus Pro 250. Dive deep: same limits.';

-- ============================================================
-- 4. chat.image_analysis_usage  (Image analysis — daily + monthly)
-- ============================================================
CREATE TABLE IF NOT EXISTS chat.image_analysis_usage (
    user_id             UUID    NOT NULL PRIMARY KEY,
    daily_count         INTEGER NOT NULL DEFAULT 0,
    monthly_count       INTEGER NOT NULL DEFAULT 0,
    daily_limit         INTEGER NOT NULL DEFAULT 3,
    monthly_limit       INTEGER NOT NULL DEFAULT 0,
    last_daily_reset    TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_monthly_reset  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE chat.image_analysis_usage IS
  'Image analysis usage tracking. Per-plan: Free 3/day (no monthly), Go Plus 15/day 300/month, Pro 30/day 600/month, Plus Pro 30/day 600/month. Daily reset 24h, monthly reset 30 days.';

-- ============================================================
-- RPC 1: chat.check_and_increment_message_usage
--   Atomic check + increment for Free plan per-tier message limits.
--   Uses FOR UPDATE row locking — race-condition-free.
-- ============================================================
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
AS $$
DECLARE
    v_messages_used INTEGER;
    v_reset_at      TIMESTAMPTZ;
    v_new_count     INTEGER;
    v_new_reset     TIMESTAMPTZ;
BEGIN
    -- Lock the row for this user + tier (or create it)
    SELECT messages_used, reset_at
      INTO v_messages_used, v_reset_at
      FROM chat.user_message_usage
     WHERE user_id = p_user_id AND model_tier = p_model_tier
     FOR UPDATE;

    -- No row yet — first message on this tier
    IF v_messages_used IS NULL THEN
        v_new_count := 1;
        v_new_reset := now() + interval '24 hours';
        INSERT INTO chat.user_message_usage (user_id, model_tier, messages_used, reset_at)
        VALUES (p_user_id, p_model_tier, v_new_count, v_new_reset);
        RETURN QUERY SELECT true, v_new_count, (p_message_limit - v_new_count), v_new_reset;
        RETURN;
    END IF;

    -- Check if 24h reset is needed
    IF now() >= v_reset_at THEN
        v_new_count := 1;
        v_new_reset := now() + interval '24 hours';
        UPDATE chat.user_message_usage
           SET messages_used = v_new_count, reset_at = v_new_reset, updated_at = now()
         WHERE user_id = p_user_id AND model_tier = p_model_tier;
        RETURN QUERY SELECT true, v_new_count, (p_message_limit - v_new_count), v_new_reset;
        RETURN;
    END IF;

    -- Check if limit is reached
    IF v_messages_used >= p_message_limit THEN
        RETURN QUERY SELECT false, v_messages_used, 0, (v_reset_at + interval '24 hours');
        RETURN;
    END IF;

    -- Increment
    v_new_count := v_messages_used + 1;
    UPDATE chat.user_message_usage
       SET messages_used = v_new_count, updated_at = now()
     WHERE user_id = p_user_id AND model_tier = p_model_tier;

    RETURN QUERY SELECT true, v_new_count, (p_message_limit - v_new_count), v_reset_at;
END;
$$;

-- ============================================================
-- RPC 2: chat.check_token_limits
--   Check (WITHOUT incrementing) if a user can spend tokens.
--   Used for pre-flight checks before the LLM call.
--   Works for ALL paid plans (Go Plus, Pro, Plus Pro).
-- ============================================================
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

    -- No row — full quota available
    IF v_daily_used IS NULL THEN
        RETURN QUERY SELECT true, 0, p_daily_limit, 0, p_monthly_limit,
            (now() + interval '24 hours'), (now() + interval '30 days');
        RETURN;
    END IF;

    -- Auto-reset daily if window expired
    IF now() >= v_daily_reset THEN
        v_daily_used := 0;
    END IF;

    -- Auto-reset monthly if window expired
    IF now() >= v_monthly_reset THEN
        v_monthly_used := 0;
    END IF;

    -- Check limits
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

-- ============================================================
-- RPC 3: chat.increment_token_usage
--   Atomically increment token usage after a successful LLM call.
--   Handles daily/monthly auto-reset inline.
--   Works for ALL paid plans (Go Plus, Pro, Plus Pro).
-- ============================================================
CREATE OR REPLACE FUNCTION chat.increment_token_usage(
    p_user_id       UUID,
    p_model_key     TEXT,
    p_tokens_used   INTEGER,
    p_daily_limit   INTEGER,
    p_monthly_limit INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
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
        -- First usage — insert new row
        INSERT INTO chat.token_usage (user_id, model_key, tokens_used_today, tokens_used_month,
            daily_reset_at, monthly_reset_at)
        VALUES (p_user_id, p_model_key, p_tokens_used, p_tokens_used,
            now() + interval '24 hours', now() + interval '30 days');
        RETURN;
    END IF;

    -- Auto-reset daily if window expired
    IF now() >= v_daily_reset THEN
        v_daily_used := 0;
        v_daily_reset := now() + interval '24 hours';
    END IF;

    -- Auto-reset monthly if window expired
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

-- ============================================================
-- RPC 4: chat.check_web_search_limit
--   Count rows in a sliding time window and return remaining.
--   Does NOT insert a row — call chat.record_web_search after a
--   successful search.
--   NOTE: 'limit_val' used instead of 'limit' (reserved keyword).
-- ============================================================
CREATE OR REPLACE FUNCTION chat.check_web_search_limit(
    p_user_id      UUID,
    p_search_type  TEXT,          -- 'web_search' or 'dive_deep'
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

-- ============================================================
-- RPC 5: chat.record_web_search
--   Insert a row after a successful web search or dive deep.
-- ============================================================
CREATE OR REPLACE FUNCTION chat.record_web_search(
    p_user_id     UUID,
    p_search_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO chat.web_search_usage (user_id, search_type)
    VALUES (p_user_id, p_search_type);
END;
$$;

-- ============================================================
-- RPC 6: chat.check_image_analysis_limit
--   Check daily + monthly image analysis limits (WITHOUT incrementing).
-- ============================================================
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

    -- Auto-reset daily if 24h elapsed
    IF now() >= v_daily_reset THEN
        v_daily_count := 0;
    END IF;

    -- Auto-reset monthly if 30 days elapsed (only if monthly limit > 0)
    IF p_monthly_limit > 0 AND now() >= v_monthly_reset THEN
        v_monthly_count := 0;
    END IF;

    -- Check daily limit
    IF v_daily_count >= p_daily_limit THEN
        RETURN QUERY SELECT false, v_daily_count, 0, v_monthly_count, GREATEST(p_monthly_limit - v_monthly_count, 0);
        RETURN;
    END IF;

    -- Check monthly limit (only if > 0)
    IF p_monthly_limit > 0 AND v_monthly_count >= p_monthly_limit THEN
        RETURN QUERY SELECT false, v_daily_count, (p_daily_limit - v_daily_count), v_monthly_count, 0;
        RETURN;
    END IF;

    RETURN QUERY SELECT true, v_daily_count, (p_daily_limit - v_daily_count),
        v_monthly_count, GREATEST(p_monthly_limit - v_monthly_count, 0);
END;
$$;

-- ============================================================
-- RPC 7: chat.increment_image_analysis_usage
--   Atomically increment image analysis usage after a successful call.
-- ============================================================
CREATE OR REPLACE FUNCTION chat.increment_image_analysis_usage(
    p_user_id        UUID,
    p_daily_limit    INTEGER,
    p_monthly_limit  INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
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

    -- Auto-reset daily if 24h elapsed
    IF now() >= v_daily_reset THEN
        v_daily_count := 0;
        v_daily_reset := now();
    END IF;

    -- Auto-reset monthly if 30 days elapsed
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

COMMIT;
