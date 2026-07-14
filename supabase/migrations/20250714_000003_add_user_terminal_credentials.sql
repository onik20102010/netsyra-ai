-- Add N code, IDE password, and terminal token columns to public.profiles
alter table public.profiles
add column if not exists n_code text,
add column if not exists ide_password text,
add column if not exists terminal_token text;

-- Enforce uniqueness across users (compatible with older PostgreSQL versions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_n_code_unique'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.profiles ADD CONSTRAINT profiles_n_code_unique UNIQUE (n_code)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_ide_password_unique'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.profiles ADD CONSTRAINT profiles_ide_password_unique UNIQUE (ide_password)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_terminal_token_unique'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.profiles ADD CONSTRAINT profiles_terminal_token_unique UNIQUE (terminal_token)';
  END IF;
END $$;

-- Security definer helper: set the IDE password for the current user with
-- a uniqueness check that bypasses row-level security (no other user can read).
-- This checks that:
--  1. The current user does not already have an IDE password (fixed forever).
--  2. No other user has the requested password.
create or replace function public.set_ide_password(p_password text)
returns jsonb
language plpgsql
security definer
as $$
declare
  existing text;
  duplicate boolean;
begin
  -- check current user already set
  select ide_password into existing
  from public.profiles
  where user_id = auth.uid();

  if existing is not null then
    return jsonb_build_object('success', false, 'error', 'IDE password already set');
  end if;

  -- check uniqueness across other users
  select exists(
    select 1 from public.profiles
    where ide_password = p_password and user_id <> auth.uid()
  ) into duplicate;

  if duplicate then
    return jsonb_build_object('success', false, 'error', 'This password has already been taken, try another password.');
  end if;

  -- upsert the profile row
  insert into public.profiles (user_id, ide_password)
  values (auth.uid(), p_password)
  on conflict (user_id)
  do update set ide_password = p_password
  where public.profiles.user_id = auth.uid();

  return jsonb_build_object('success', true);
end;
$$;

-- Security definer helper: generate a unique numeric N code for the current user
-- and persist it. If the user already has one, return it without overwriting.
create or replace function public.generate_n_code()
returns jsonb
language plpgsql
security definer
as $$
declare
  existing text;
  code text;
  attempt int := 0;
  conflict boolean;
  max_attempts constant int := 50;
begin
  -- return existing code if present
  select n_code into existing
  from public.profiles
  where user_id = auth.uid();

  if existing is not null then
    return jsonb_build_object('success', true, 'n_code', existing);
  end if;

  loop
    attempt := attempt + 1;
    if attempt > max_attempts then
      return jsonb_build_object('success', false, 'error', 'Could not generate a unique N code');
    end if;

    code := lpad(floor(random() * 900000 + 100000)::int::text, 6, '0');

    select exists(
      select 1 from public.profiles where n_code = code
    ) into conflict;

    if not conflict then
      -- ensure the user's profile row exists
      insert into public.profiles (user_id, n_code)
      values (auth.uid(), code)
      on conflict (user_id)
      do update set n_code = code
      where public.profiles.user_id = auth.uid();

      return jsonb_build_object('success', true, 'n_code', code);
    end if;
  end loop;
end;
$$;

-- Security definer helper: verify the N code and IDE password for the current user
-- and generate a unique terminal token for command generation.
-- The generated token is stored so the IDE can reuse it.
create or replace function public.verify_terminal_credentials(p_n_code text, p_ide_password text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  stored_n_code text;
  stored_password text;
  new_token text;
  token_conflict boolean;
  attempt int := 0;
  max_attempts constant int := 50;
begin
  v_user_id := auth.uid();

  select n_code, ide_password into stored_n_code, stored_password
  from public.profiles
  where user_id = v_user_id;

  if stored_n_code is null or stored_password is null then
    return jsonb_build_object('success', false, 'error', 'check this problem...');
  end if;

  if stored_n_code <> p_n_code or stored_password <> p_ide_password then
    return jsonb_build_object('success', false, 'error', 'check this problem...');
  end if;

  -- generate a unique terminal token
  loop
    attempt := attempt + 1;
    if attempt > max_attempts then
      return jsonb_build_object('success', false, 'error', 'Could not generate a terminal token');
    end if;

    new_token := encode(sha256(convert_to(v_user_id::text || p_n_code || p_ide_password || gen_random_uuid()::text, 'UTF8')), 'hex');

    select exists(
      select 1 from public.profiles where terminal_token = new_token
    ) into token_conflict;

    if not token_conflict then
      update public.profiles
      set terminal_token = new_token
      where user_id = v_user_id;

      return jsonb_build_object('success', true, 'token', new_token);
    end if;
  end loop;
end;
$$;

-- Keep the RLS policies consistent with the new columns
grant execute on function public.set_ide_password(text) to authenticated;
grant execute on function public.generate_n_code() to authenticated;
grant execute on function public.verify_terminal_credentials(text, text) to authenticated;