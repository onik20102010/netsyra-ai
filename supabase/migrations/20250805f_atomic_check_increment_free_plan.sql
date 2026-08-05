-- ============================================================
-- Atomic check-and-increment for Free plan message limits
-- ============================================================
-- 
-- WHY THIS EXISTS:
-- The TypeScript code does read-then-write (SELECT then UPDATE),
-- which creates race conditions under concurrent requests.
-- Two simultaneous messages both read "4", both pass the check,
-- both write "5" — user gets 6 messages on a 5-message limit.
--
-- This SQL function uses FOR UPDATE row locking inside a single
-- transaction, making the check+increment truly atomic.
--
-- YOU MUST RUN THIS IN YOUR SUPABASE SQL EDITOR.
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

    -- If insert failed due to concurrent insert, re-read with lock
    IF NOT FOUND THEN
      SELECT * INTO v_usage
      FROM chat.user_model_usage
      WHERE user_id = p_user_id AND model_id = p_model_id
      FOR UPDATE;
      
      -- Fall through to normal check below
    ELSE
      RETURN jsonb_build_object(
        'allowed', true,
        'messages_sent', 1,
        'messages_remaining', p_message_limit - 1,
        'resets_at', v_now + INTERVAL '24 hours'
      );
    END IF;
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
      'resets_at', v_reset_at + INTERVAL '24 hours'
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

-- ============================================================
-- Safety: ensure unique constraint exists (prevents duplicate rows)
-- ============================================================
-- The table already has UNIQUE(user_id, model_id) from the original
-- migration, but this ensures it exists even if the table was modified.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'chat.user_model_usage'::regclass
      AND contype = 'u'
      AND array_to_string(conkey, ',') = (
        SELECT array_to_string(array_agg(attnum), ',')
        FROM pg_attribute
        WHERE attrelid = 'chat.user_model_usage'::regclass
          AND attname IN ('user_id', 'model_id')
      )
  ) THEN
    ALTER TABLE chat.user_model_usage
      ADD CONSTRAINT user_model_usage_user_id_model_id_key UNIQUE (user_id, model_id);
  END IF;
END $$;

-- ============================================================
-- Safety: ensure index exists for fast lookups under high load
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_model_usage_user_model
  ON chat.user_model_usage (user_id, model_id);

