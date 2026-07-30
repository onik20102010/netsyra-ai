CREATE OR REPLACE FUNCTION public.increment_image_analysis_usage_simple(
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.image_analysis_usage (
    user_id, 
    daily_count, 
    monthly_count, 
    daily_limit, 
    monthly_limit, 
    last_daily_reset, 
    last_monthly_reset
  )
  VALUES (
    p_user_id, 
    1, 
    1, 
    30, 
    600, 
    NOW(), 
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    daily_count = image_analysis_usage.daily_count + 1,
    monthly_count = image_analysis_usage.monthly_count + 1,
    updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_image_analysis_usage_simple TO authenticated;