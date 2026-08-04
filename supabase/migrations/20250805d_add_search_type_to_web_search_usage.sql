-- Add search_type column to web_search_usage to distinguish
-- regular web search from dive deep (N Live) searches.
-- This allows independent limit tracking for each feature.

ALTER TABLE public.web_search_usage
ADD COLUMN IF NOT EXISTS search_type TEXT NOT NULL DEFAULT 'web_search';

-- Index for fast filtering by search_type within a time window
CREATE INDEX IF NOT EXISTS idx_web_search_usage_type
  ON public.web_search_usage(user_id, search_type, created_at DESC);

-- Update the count function to optionally filter by search_type
CREATE OR REPLACE FUNCTION public.count_web_searches_in_window(
  p_user_id UUID,
  p_window_hours INTEGER DEFAULT 24,
  p_search_type TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_search_type IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM public.web_search_usage
    WHERE user_id = p_user_id
      AND search_type = p_search_type
      AND created_at >= NOW() - (p_window_hours || ' hours')::INTERVAL;
  ELSE
    SELECT COUNT(*) INTO v_count
    FROM public.web_search_usage
    WHERE user_id = p_user_id
      AND created_at >= NOW() - (p_window_hours || ' hours')::INTERVAL;
  END IF;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON COLUMN public.web_search_usage.search_type IS
  'Type of search: web_search (user toggled web search button) or dive_deep (N Live / Dive Deep feature). Used for independent limit tracking.';
