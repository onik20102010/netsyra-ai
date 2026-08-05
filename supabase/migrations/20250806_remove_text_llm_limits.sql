-- ──────────────────────────────────────────────────────────────────────
-- Remove ALL limit enforcement from the project.
--
-- This drops:
--   • Text LLM limit tables: user_model_usage, token_usage, chat_usage,
--     ni_token_usage, gpt5_token_usage
--   • Web search / dive deep limit tables: web_search_usage
--   • Image analysis limit tables: image_analysis_usage
--   • All related RPC functions
--
-- The project is now fully limit-less.
-- ──────────────────────────────────────────────────────────────────────

BEGIN;

-- ── Drop text-LLM limit tables (chat schema) ──
DROP TABLE IF EXISTS chat.user_model_usage CASCADE;
DROP TABLE IF EXISTS chat.token_usage CASCADE;
DROP TABLE IF EXISTS chat.chat_usage CASCADE;

-- ── Drop NI / GPT-5 per-LLM token tables (chat schema) ──
DROP TABLE IF EXISTS chat.ni_token_usage CASCADE;
DROP TABLE IF EXISTS chat.gpt5_token_usage CASCADE;

-- ── Drop web search / dive deep usage table (chat schema) ──
DROP TABLE IF EXISTS chat.web_search_usage CASCADE;

-- ── Drop image analysis usage table (chat schema) ──
DROP TABLE IF EXISTS chat.image_analysis_usage CASCADE;

-- ── Drop text-LLM limit RPC functions (chat schema) ──
DROP FUNCTION IF EXISTS chat.check_and_increment_model_usage(UUID, TEXT);
DROP FUNCTION IF EXISTS chat.check_model_limit(UUID, TEXT);
DROP FUNCTION IF EXISTS chat.increment_model_usage(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS chat.check_token_limits(UUID, TEXT, INTEGER, INTEGER, TEXT);
DROP FUNCTION IF EXISTS chat.increment_token_usage(UUID, TEXT, INTEGER, TEXT);
DROP FUNCTION IF EXISTS chat.get_or_reset_model_usage(UUID, TEXT);
DROP FUNCTION IF EXISTS chat.check_all_limits_exhausted(UUID);
DROP FUNCTION IF EXISTS chat.get_total_model_remaining(UUID);

-- ── Drop NI / GPT-5 per-LLM token RPC functions (chat schema) ──
DROP FUNCTION IF EXISTS chat.get_or_reset_ni_token_usage(UUID, TEXT);
DROP FUNCTION IF EXISTS chat.deduct_ni_tokens(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS chat.check_ni_limits_exhausted(UUID);
DROP FUNCTION IF EXISTS chat.get_total_ni_remaining(UUID);
DROP FUNCTION IF EXISTS chat.get_or_reset_gpt5_token_usage(UUID, TEXT);
DROP FUNCTION IF EXISTS chat.deduct_gpt5_tokens(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS chat.check_gpt5_limits_exhausted(UUID);
DROP FUNCTION IF EXISTS chat.get_total_gpt5_remaining(UUID);

-- ── Drop image analysis RPC functions (chat schema) ──
DROP FUNCTION IF EXISTS chat.check_image_analysis_limits_exhausted(UUID);
DROP FUNCTION IF EXISTS chat.deduct_image_analysis_credit(UUID);
DROP FUNCTION IF EXISTS chat.get_or_reset_image_analysis_usage(UUID);

-- ── Drop public-schema token usage table if present ──
DROP TABLE IF EXISTS public.token_usage CASCADE;

COMMIT;
