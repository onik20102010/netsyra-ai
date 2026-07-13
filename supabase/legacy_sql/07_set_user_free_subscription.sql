update public.profiles
set subscription_tier = 'free',
    subscription_expires_at = null
where user_id = 'eee307da-7a28-4b42-a518-2bb93ecafe0c';

select subscription_tier, subscription_expires_at
from public.profiles
where user_id = 'eee307da-7a28-4b42-a518-2bb93ecafe0c';
