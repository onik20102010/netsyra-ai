-- Persist chat style preferences per user instead of only in localStorage.
--
-- Previously the profile page stored sectionSpacing / wordSpacing / tableEdges /
-- fontSize / chatTheme in localStorage, so preferences were lost when the user
-- cleared their browser data or signed in on another device. They now live on
-- the user's profile row and are readable/writable via the existing profiles
-- RLS policies ("Users can read own profile" / "Users can update own profile").

alter table public.profiles
  add column if not exists style_prefs jsonb not null default '{}'::jsonb;

comment on column public.profiles.style_prefs is
  'Chat display preferences: { sectionSpacing, wordSpacing, tableEdges, fontSize, chatTheme }. Empty object means "use defaults".';
