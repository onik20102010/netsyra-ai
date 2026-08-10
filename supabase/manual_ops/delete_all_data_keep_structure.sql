-- ============================================
-- DELETE ALL DATA - KEEP TABLE STRUCTURE
-- ============================================
-- This script deletes ALL data from your Supabase database
-- while preserving table structures, indexes, and policies.
--
-- SCHEMAS AFFECTED:
-- - public (profiles, conversations, messages, memories, customers, subscriptions)
-- - chat (all chat-related tables)
-- - ide (all IDE-related tables)
--
-- WARNING: This also deletes ALL Supabase Auth users, IDs, emails, sessions,
-- identities, login records, and other authentication data.
-- ============================================

BEGIN;

-- Disable triggers temporarily for faster deletion
SET session_replication_role = 'replica';

-- ============================================
-- DELETE FROM IDE SCHEMA (no dependencies)
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'ide' AND table_name = 'user_folder_structure') THEN
        TRUNCATE TABLE ide.user_folder_structure CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'ide' AND table_name = 'project_memory') THEN
        TRUNCATE TABLE ide.project_memory CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'ide' AND table_name = 'ide_file_chunks') THEN
        TRUNCATE TABLE ide.ide_file_chunks CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'ide' AND table_name = 'ide_files') THEN
        TRUNCATE TABLE ide.ide_files CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'ide' AND table_name = 'ide_token_usage') THEN
        TRUNCATE TABLE ide.ide_token_usage CASCADE;
    END IF;
END $$;

-- ============================================
-- DELETE FROM CHAT SCHEMA (handle dependencies)
-- ============================================

DO $$
BEGIN
    -- Delete in order of dependencies (child tables first)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'chat' AND table_name = 'retrieval_logs') THEN
        TRUNCATE TABLE chat.retrieval_logs CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'chat' AND table_name = 'episodic_memories') THEN
        TRUNCATE TABLE chat.episodic_memories CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'chat' AND table_name = 'memories') THEN
        TRUNCATE TABLE chat.memories CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'chat' AND table_name = 'chat_summaries') THEN
        TRUNCATE TABLE chat.chat_summaries CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'chat' AND table_name = 'bot_persona_notes') THEN
        TRUNCATE TABLE chat.bot_persona_notes CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'chat' AND table_name = 'user_model_usage') THEN
        TRUNCATE TABLE chat.user_model_usage CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'chat' AND table_name = 'user_preferences') THEN
        TRUNCATE TABLE chat.user_preferences CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'chat' AND table_name = 'chat_usage') THEN
        TRUNCATE TABLE chat.chat_usage CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'chat' AND table_name = 'messages') THEN
        TRUNCATE TABLE chat.messages CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'chat' AND table_name = 'conversations') THEN
        TRUNCATE TABLE chat.conversations CASCADE;
    END IF;
    
    -- Delete usage tracking tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'chat' AND table_name = 'image_analysis_usage') THEN
        TRUNCATE TABLE chat.image_analysis_usage CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'chat' AND table_name = 'web_search_usage') THEN
        TRUNCATE TABLE chat.web_search_usage CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'chat' AND table_name = 'token_usage') THEN
        TRUNCATE TABLE chat.token_usage CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'chat' AND table_name = 'user_message_usage') THEN
        TRUNCATE TABLE chat.user_message_usage CASCADE;
    END IF;
END $$;

-- ============================================
-- DELETE FROM PUBLIC SCHEMA (handle dependencies)
-- ============================================

DO $$
BEGIN
    -- Delete in order of dependencies
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'memories') THEN
        TRUNCATE TABLE public.memories CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
        TRUNCATE TABLE public.messages CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
        TRUNCATE TABLE public.conversations CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        TRUNCATE TABLE public.profiles CASCADE;
    END IF;
    
    -- Delete subscription tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
        TRUNCATE TABLE public.subscriptions CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        TRUNCATE TABLE public.customers CASCADE;
    END IF;
END $$;

-- ============================================
-- RESET SEQUENCES (if any)
-- ============================================

-- Reset sequences for tables with serial columns (if you have any)
-- Uncomment if you have serial columns that need resetting
-- ALTER SEQUENCE IF EXISTS public.table_name_id_seq RESTART WITH 1;

-- ============================================
-- CLEAR ANY OTHER TABLES LINKED TO auth.users
-- ============================================
-- This catches tables not listed above, such as an older or differently
-- located ide_token_usage table. It preserves the tables and only removes rows.
DO $cleanup$
DECLARE
    table_record record;
BEGIN
    FOR table_record IN
        SELECT DISTINCT
            child_ns.nspname AS schema_name,
            child_table.relname AS table_name
        FROM pg_constraint constraint_row
        JOIN pg_class child_table
          ON child_table.oid = constraint_row.conrelid
        JOIN pg_namespace child_ns
          ON child_ns.oid = child_table.relnamespace
        WHERE constraint_row.contype = 'f'
          AND constraint_row.confrelid = 'auth.users'::regclass
          AND child_ns.nspname NOT IN ('pg_catalog', 'information_schema')
          AND NOT (
              child_ns.nspname = 'auth'
              AND child_table.relname = 'users'
          )
    LOOP
        EXECUTE format(
            'TRUNCATE TABLE %I.%I CASCADE',
            table_record.schema_name,
            table_record.table_name
        );
    END LOOP;
END
$cleanup$;

-- Re-enable triggers before deleting auth users so Supabase's normal
-- cascading cleanup removes identities, sessions, refresh tokens, MFA data,
-- and related user records correctly.
SET session_replication_role = 'origin';

-- Deletes every user account, email address, user ID, login identity,
-- session, refresh token, and other user-linked authentication data.
-- The auth table structure and authentication configuration remain.
DELETE FROM auth.users;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES (run these to verify deletion)
-- ============================================

-- Check row counts (should all be 0)
-- SELECT 'public.profiles' as table_name, count(*) FROM public.profiles
-- UNION ALL
-- SELECT 'public.conversations', count(*) FROM public.conversations
-- UNION ALL
-- SELECT 'public.messages', count(*) FROM public.messages
-- UNION ALL
-- SELECT 'public.memories', count(*) FROM public.memories
-- UNION ALL
-- SELECT 'public.customers', count(*) FROM public.customers
-- UNION ALL
-- SELECT 'public.subscriptions', count(*) FROM public.subscriptions
-- UNION ALL
-- SELECT 'chat.conversations', count(*) FROM chat.conversations
-- UNION ALL
-- SELECT 'chat.messages', count(*) FROM chat.messages
-- UNION ALL
-- SELECT 'chat.memories', count(*) FROM chat.memories
-- UNION ALL
-- SELECT 'chat.chat_usage', count(*) FROM chat.chat_usage
-- UNION ALL
-- SELECT 'ide.ide_token_usage', count(*) FROM ide.ide_token_usage;

-- ============================================
-- IMPORTANT
-- ============================================
-- All user data is deleted by the command above.
-- Tables, columns, indexes, functions, RLS policies, and auth configuration
-- are preserved so the database is ready for new users.
