-- Add pinned and archived columns to public.conversations table
-- These columns are used by the chat sidebar for conversation management

alter table public.conversations
add column if not exists pinned boolean default false,
add column if not exists archived boolean default false,
add column if not exists folder text default '';
