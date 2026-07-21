-- Create subscriptions table for Paddle billing
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paddle_subscription_id text,
  paddle_price_id text,
  status text NOT NULL DEFAULT 'active', -- active, cancelled, past_due
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Only allow insert/update by service key (via webhook)
-- For now, insert is allowed for authenticated (will be handled by webhook)
