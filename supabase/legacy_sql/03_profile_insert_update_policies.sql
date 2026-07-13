-- Allow users to insert their own profile
create policy if not exists "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (user_id = auth.uid());

-- Allow users to update their own profile
create policy if not exists "Users can update own profile"
on public.profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
