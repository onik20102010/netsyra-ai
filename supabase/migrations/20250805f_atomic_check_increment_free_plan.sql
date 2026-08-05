-- ============================================================
-- Atomic check-and-increment for Free plan message limits
-- ============================================================
--
-- PROBLEM: The old flow was:
--   1. checkModelLimit (read) → allowed
--   2. API call (slow, 5-30 seconds)
--   3. trackChatUsage → incrementModelUsage (write) — fire-and-forget async
--
-- This created TWO race conditions:
--   a) The increment was fire-and-forget (.catch(console.error)), so the
--      next message's check ran BEFORE the previous increment completed.
--   b) incrementModelUsage used read-then-write (SELECT then UPSERT),
--      so concurrent requests overwrote each other's counts.
--
-- RESULT: A user could send 7+ messages on N Pro (limit=5) because the
--         counter never reached 5 before the next check ran.
--
-- SOLUTION: This function atomically checks AND increments in a single
--           transaction with FOR UPDATE lock. Called BEFORE the API call.
--           If the limit is hit, returns allowed=false and does NOT increment.
--           If allowed, increments immediately so the next concurrent
--           request sees the updated count.
-- ============================================================

CREATE OR REPLACE FUNCTION chat.check_and_increment_model_usage(
  p_user_id UUID,
  p_model_id TEXT,
  p_message_limit INT,
  p_token_limit INT,
  p_estimated_tokens INT
) RETURNS JSONB AS $$
DECLARE
  v_usage RECORD;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_messages_sent INT;
  v_tokens_used INT;
  v_reset_at TIMESTAMP WITH TIME ZONE;
  v_hours_since_reset NUMERIC;
BEGIN
  -- Lock the row for this user+model (or create if not exists)
  SELECT * INTO v_usage
  FROM chat.user_model_usage
  WHERE user_id = p_user_id AND model_id = p_model_id
  FOR UPDATE;

  -- No record exists yet — create one with this message counted
  IF NOT FOUND THEN
    INSERT INTO chat.user_model_usage (
      user_id, model_id, tokens_used, messages_sent, reset_at
    ) VALUES (
      p_user_id, p_model_id, p_estimated_tokens, 1, v_now + INTERVAL '24 hours'
    )
    ON CONFLICT (user_id, model_id) DO NOTHING;

    RETURN jsonb_build_object(
      'allowed', true,
      'messages_sent', 1,
      'messages_remaining', p_message_limit - 1,
      'resets_at', v_now + INTERVAL '24 hours'
    );
  END IF;

  -- Check if reset is needed (24h window)
  v_reset_at := v_usage.reset_at;
  v_hours_since_reset := EXTRACT(EPOCH FROM (v_now - v_reset_at)) / 3600;

  IF v_hours_since_reset >= 24 THEN
    -- Reset window
    v_messages_sent := 1;
    v_tokens_used := p_estimated_tokens;
    v_reset_at := v_now + INTERVAL '24 hours';

    UPDATE chat.user_model_usage
    SET messages_sent = v_messages_sent,
        tokens_used = v_tokens_used,
        reset_at = v_reset_at
    WHERE user_id = p_user_id AND model_id = p_model_id;

    RETURN jsonb_build_object(
      'allowed', true,
      'messages_sent', v_messages_sent,
      'messages_remaining', p_message_limit - v_messages_sent,
      'resets_at', v_reset_at
    );
  END IF;

  -- Check limits BEFORE incrementing
  v_messages_sent := v_usage.messages_sent;
  v_tokens_used := v_usage.tokens_used;

  IF v_messages_sent >= p_message_limit OR v_tokens_used >= p_token_limit THEN
    -- Limit reached — do NOT increment, return blocked
    RETURN jsonb_build_object(
      'allowed', false,
      'messages_sent', v_messages_sent,
      'messages_remaining', 0,
      'resets_at', v_reset_at
    );
  END IF;

  -- Limit not reached — increment atomically
  v_messages_sent := v_messages_sent + 1;
  v_tokens_used := v_tokens_used + p_estimated_tokens;

  UPDATE chat.user_model_usage
  SET messages_sent = v_messages_sent,
      tokens_used = v_tokens_used
  WHERE user_id = p_user_id AND model_id = p_model_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'messages_sent', v_messages_sent,
    'messages_remaining', p_message_limit - v_messages_sent,
    'resets_at', v_reset_at
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION chat.check_and_increment_model_usage TO authenticated;

-- Also fix the reset_at column: old rows may have reset_at = creation time
-- (not creation + 24h), causing immediate resets. Update them to be forward-looking.
UPDATE chat.user_model_usage
SET reset_at = NOW() + INTERVAL '24 hours'
WHERE reset_at < NOW() - INTERVAL '24 hours'
  AND messages_sent = 0;
