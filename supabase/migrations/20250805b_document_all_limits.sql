-- ============================================================
-- Document the complete limit structure (post-cleanup)
-- 
-- This migration adds SQL comments documenting every limit enforced
-- by Netsyra. The actual enforcement lives in:
--   - TypeScript: src/lib/chat/model-registry.ts (maxTokens per tier)
--   - TypeScript: src/lib/routers/router-config.ts (plan-level limits)
--   - SQL: ni_token_usage, gpt5_token_usage, token_usage, 
--          image_analysis_usage, web_search_usage, ide.agent_message_limits
--
-- No table schema changes — documentation only.
-- ============================================================

-- ── Per-tier maxTokens (output cap per LLM request) ──
-- Source of truth: src/lib/chat/model-registry.ts `tiers` record
COMMENT ON TABLE chat.chat_usage IS
  'Legacy per-tier message counting. Limits: fast=15, plus=10, pro=5, code=5, live=5, aai=5 per 24h. NOTE: the chat route now uses token-based limits (token_usage table) as primary enforcement; this table is a secondary system that also tracks message counts for display.';

-- ── Per-LLM daily token limits (NI tier / Pro plan) ──
COMMENT ON TABLE public.ni_token_usage IS
  'Per-LLM daily token tracking for NI tier (Pro plan). Tracked models: claude-opus-4.6 (10,000 tokens/day), claude-sonnet-4.6 (16,000 tokens/day), deepseek-v4-pro (34,000 tokens/day). UNTRACKED (unlimited): deepseek-v4-flash. 24h reset. When a model hits its daily limit, that model is locked for 24h for that user; the NI router falls back to the next available model.';

COMMENT ON TABLE public.gpt5_token_usage IS
  'Per-LLM daily token tracking for GPT-5 models (NI tier / Pro plan). gpt-5: 20,000 tokens/day. gpt-5-mini: 34,000 tokens/day. 24h reset. Same lockout + fallback behavior as ni_token_usage.';

-- ── Generic token usage (Free, Go Plus, Plus Pro plans) ──
COMMENT ON TABLE public.token_usage IS
  'Generic per-tier (and per-model for Plus Pro) token usage tracking. Free plan: 6,800 tokens/day, 204,000 tokens/month. Go Plus: 317,000/day, 9,523,810/month. Plus Pro per-model: plus_pro_opus 27,778/day 833,333/month, plus_pro_luna 47,619/day 1,428,571/month, plus_pro_deepseek 204,342/day 6,130,268/month. NI tier does NOT use this table (uses ni_token_usage + gpt5_token_usage instead).';

-- ── Image analysis limits (per-plan) ──
COMMENT ON TABLE public.image_analysis_usage IS
  'Image analysis usage tracking. Per-plan limits: Free 3/day (no monthly), Go Plus 15/day 300/month, Pro 30/day 600/month, Plus Pro 30/day 600/month. Daily reset: 24h. Monthly reset: 30 days. The app writes the plan-aware daily_limit and monthly_limit values into each row.';

-- ── Web search limits (per-plan, router-config is source of truth) ──
COMMENT ON TABLE public.web_search_usage IS
  'Web search usage tracking (one row per search). Per-plan limits enforced by router-config.ts: Free 3/24h, Go Plus 100/6h, Pro 200/6h, Plus Pro 250/6h. Counting is done by the app via row count in a time window (see web-search-limiter.ts).';

-- ── IDE agent limits ──
COMMENT ON TABLE ide.agent_message_limits IS
  'IDE agent message limits. 3 user messages per 24h for all users. Counts USER messages (not LLM API calls) — one agent run with 20 tool rounds = 1 message.';

-- ── Per-tier maxTokens reference (code-level, documented here) ──
-- These are NOT enforced by SQL — they are the max_output_tokens parameter
-- passed to each LLM API call. Documented here for reference.
--
--   fast:      200   (Groq: llama-3.1-8b-instant, groq/compound, etc.)
--   plus:      800   (Gemini: gemini-2.5-flash, gemini-3-flash, etc.)
--   pro:       1500  (Gemini: gemini-2.5-pro, gemini-3.5-flash, etc.)
--   live:      400   (Groq: groq/compound, groq/compound-mini)
--   code:      1400  (Cerebras: gpt-oss-120b, glm-4.7)
--   aai:       1700  (Groq: llama-3.3-70b-versatile, qwen/qwen3-32b)
--   go_plus:   5000  (DeepSeek: deepseek-v4-flash)
--   ni:        9000  (Anthropic/OpenAI/DeepSeek: claude-opus-4.6, gpt-5, etc.)
--   plus_pro:  10000 (Anthropic/OpenAI/DeepSeek: claude-opus-4.8, gpt-5.6-luna, etc.)
