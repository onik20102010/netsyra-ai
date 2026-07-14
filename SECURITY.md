# Netsyra Security Guide

This document lists the security assumptions and required configuration for the Netsyra IDE to be safe in production.

## Environment variables

Copy `.env.example` to `.env.local` and fill in real values. **Never commit `.env.local`.**

Key variables:

- `ADMIN_EMAIL` / `NEXT_PUBLIC_ADMIN_EMAIL` — the email address of the admin user.
- `AGENT_TOKEN` — optional fixed token for the local agent. If unset, a 64-character random token is generated each time the agent starts.
- `AGENT_HOST` — bind host for the local agent. Default: `127.0.0.1`.
- `AGENT_PORT` — bind port for the local agent. Default: `3001`.
- `AGENT_TLS_CERT` / `AGENT_TLS_KEY` — paths to `mkcert` certificates when running from a remote (https) origin.

## Supabase Row Level Security

The application assumes the tables below are protected by RLS and policies similar to these. Replace `auth.uid()` with the column that matches the authenticated user ID.

```sql
-- Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see messages in their conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
  );

-- User profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- User preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Chat usage
ALTER TABLE chat_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own usage" ON chat_usage
  FOR ALL USING (auth.uid() = user_id);

-- Group chats
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can see group chats" ON group_chats
  FOR SELECT USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- Group members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can see their group memberships" ON group_members
  FOR ALL USING (auth.uid() = user_id);

-- Admin functions
-- The admin dashboard relies on the admin email. For anything beyond basic read counts,
-- use a `user_role` table and `is_admin()` helper instead of hardcoded emails.
```

## Local agent hardening

- The agent now generates a 64-character random token or accepts `AGENT_TOKEN` from the environment.
- It binds to `127.0.0.1` by default and rejects connections from outside the local origin unless `AGENT_ALLOWED_ORIGINS` is set.
- `wss://` is required for remote origins; `ws://` is only allowed from `http://localhost:3000` and `http://127.0.0.1:3000`.
- Command execution is restricted to the opened project directory; `cwd` must be inside the project root.
- The shell must be `cmd`, `powershell`, or `pwsh`.

## Web application hardening

- `next.config.ts` adds security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- `middleware.ts` now protects `/ide`, `/profile`, `/usage`, `/cv-builder`, `/admin`, and `/chat`.
- `chat` API route uses a safe SSRF-aware fetch that blocks private IP ranges and local hostnames.
- `/api/search`, `/api/widget`, `/api/groups/chat`, `/api/user/preferences`, and `/api/chat` now enforce authentication and input validation.
- The IDE API routes (`/ide/api/agent`, `/ide/api/runtime`, `/ide/api/stream`, `/ide/api/workspace`) require a valid Supabase session by default. Set `REQUIRE_AUTH=false` only for local development.

## Server-side workspace fallback

The `/ide/api/workspace` route provides a server-side fallback for the IDE workspace. When running the IDE in a local agent setup, set `DISABLE_SERVER_IDE=true` so that the workspace is only operated through the local agent and never on the Next.js server filesystem.

## IDE and Chat separation

Netsyra IDE and Netsyra Chat are fully separated at the database layer:

- Chat data lives in the `chat` schema: `chat.conversations`, `chat.messages`, `chat.group_chats`, `chat.group_members`, `chat.chat_usage`, `chat.user_preferences`, `chat.user_model_usage`, `chat.bot_persona_notes`, `chat.chat_summaries`, `chat.memories`, `chat.episodic_memories`, `chat.retrieval_logs`.
- IDE data lives in the `ide` schema: `ide.ide_token_usage`, `ide.ide_files`, `ide.ide_file_chunks`, `ide.project_memory`, `ide.user_folder_structure`.
- Shared auth/profile data remains in the `public` schema: `public.profiles`, `auth.users`.
- The Supabase client helpers `createChatClient`, `createChatServerClient`, `createIdeClient`, and `createIdeServerClient` target the correct schema for each product.
- No `chat` table or code is imported by the IDE, and no `ide` code imports `chat` tables or models.

## Still recommended

- Add Upstash/Redis rate limiting for the chat API and group chat API.
- Replace hardcoded `ADMIN_EMAIL` with role-based checks via a `user_roles` table.
- Use `supabase.rpc` or Postgres advisory locks for the `chat_usage` and `user_model_usage` counters to avoid race conditions.
- Add `zod` validation for all public API request bodies.
- Keep the local agent behind a firewall or VPN when used outside localhost.
- Rotate any leaked API keys immediately.
