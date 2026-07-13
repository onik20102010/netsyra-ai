select
  au.email,
  p.name as display_name,
  count(m.id) as total_messages,
  count(distinct c.id) as total_conversations
from auth.users au
left join public.profiles p on p.user_id = au.id
left join public.conversations c on c.user_id = au.id
left join public.messages m on m.conversation_id = c.id
group by au.email, p.name
order by total_messages desc;
