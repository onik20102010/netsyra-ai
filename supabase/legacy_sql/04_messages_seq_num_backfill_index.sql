-- Add sequence number column if missing
alter table public.messages
add column if not exists seq_num int default 0;

-- Backfill seq_num for all existing messages (run once)
update public.messages
set seq_num = sub.rn
from (
  select id,
         row_number() over (partition by conversation_id order by created_at asc) as rn
  from public.messages
) as sub
where messages.id = sub.id;

-- Create index for fast ordered queries
create index if not exists messages_conv_created_idx
on public.messages (conversation_id, created_at asc);
