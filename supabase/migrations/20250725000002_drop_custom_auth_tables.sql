-- Migration: 20250725000002_drop_custom_auth_tables.sql
-- Description: Removes the tables related to the old custom authentication system.
-- This is a foundational step for migrating to the native Supabase Auth.

-- Drop the user assignments table first as it has foreign keys to both users and roles.
DROP TABLE IF EXISTS public.user_assignments;

-- Drop the old users and roles tables. 
-- CASCADE is used to automatically remove any dependent objects, such as foreign key constraints in other tables.
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- COMMENT: This migration removes the custom authentication tables (users, roles, user_assignments) to prepare for the adoption of native Supabase Auth.
