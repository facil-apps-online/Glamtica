-- Migration: 20250725000012_refactor_check_superadmin_exists.sql
-- Description: Refactors the check_superadmin_exists RPC to use the native Supabase Auth system.

-- Step 1: Drop the old function that depended on the now-deleted custom auth tables.
DROP FUNCTION IF EXISTS public.check_superadmin_exists();

-- Step 2: Create the new, refactored check_superadmin_exists function.
CREATE OR REPLACE FUNCTION public.check_superadmin_exists()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    superadmin_exists BOOLEAN;
BEGIN
    -- The new logic checks for a user in auth.users
    -- whose app_metadata contains the 'super_admin' role.
    SELECT EXISTS (
        SELECT 1
        FROM auth.users
        WHERE raw_app_meta_data ->> 'role' = 'super_admin'
    ) INTO superadmin_exists;

    RETURN superadmin_exists;
END;
$$;

-- COMMENT: Refactors the check_superadmin_exists RPC to be compatible with the native Supabase Auth system, checking for the super_admin role in the app_metadata of auth.users.
