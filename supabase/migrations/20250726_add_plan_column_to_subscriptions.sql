-- Add plan column to subscriptions table
-- This column will store the plan name (e.g., 'Go Plus', 'Pro', '+ Pro')
-- Populated by the webhook handler using the product name or ID

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS plan TEXT;
