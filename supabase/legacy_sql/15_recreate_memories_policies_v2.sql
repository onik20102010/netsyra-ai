-- Drop old policies (safe)
drop policy if exists "Users can read own memories" on public.memories;
drop policy if exists "Users can insert own memories" on public.memories;

-- Recreate policies
create policy "Users can read own memories"
on public.memories
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own memories"
on public.memories
for insert
to authenticated
with check (user_id = auth.uid());
