update public.profiles
set subscription_tier = 'paid',
    subscription_expires_at = now() + interval '30 days'
where user_id = '<user-id>';
