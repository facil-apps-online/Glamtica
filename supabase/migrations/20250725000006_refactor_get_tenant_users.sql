-- Migration: 20250725000006_refactor_get_tenant_users.sql
-- Description: Refactors the get_tenant_users RPC to use the native Supabase Auth system.

-- Step 1: Drop the old function that depended on the now-deleted custom auth tables.
DROP FUNCTION IF EXISTS public.get_tenant_users(uuid, text);

-- Step 2: Create the new, refactored get_tenant_users function.
CREATE OR REPLACE FUNCTION public.get_tenant_users(
  p_target_tenant_id uuid
)
RETURNS TABLE (
  assignment_id uuid,
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  role_name text,
  role_display_name text,
  branch_name text,
  status text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_caller_role TEXT := (auth.jwt() -> 'app_metadata' ->> 'role');
    v_caller_tenant_id UUID := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
BEGIN
    -- Step 2a: Authorization Check
    -- Ensure the caller has an administrative role.
    IF v_caller_role NOT IN ('super_admin', 'tenant_super_admin', 'tenant_admin') THEN
        RAISE EXCEPTION 'Access denied. You do not have permission to view users.';
    END IF;

    -- Ensure non-super_admins can only view users within their own tenant.
    IF v_caller_role != 'super_admin' AND v_caller_tenant_id != p_target_tenant_id THEN
        RAISE EXCEPTION 'Access denied. You can only view users within your own tenant.';
    END IF;

    -- Step 2b: Main Query
    -- This query now reads from auth.users and decodes the app_metadata JSON field.
    RETURN QUERY
    SELECT
        (u.raw_app_meta_data ->> 'assignment_id')::uuid as assignment_id,
        u.id as user_id,
        u.email,
        (u.raw_user_meta_data ->> 'first_name') as first_name,
        (u.raw_user_meta_data ->> 'last_name') as last_name,
        (u.raw_app_meta_data ->> 'role') as role_name,
        r.display_name as role_display_name,
        b.name as branch_name,
        (u.raw_app_meta_data ->> 'assignment_status') as status
    FROM
        auth.users u
    LEFT JOIN
        public.roles r ON (u.raw_app_meta_data ->> 'role') = r.name
    LEFT JOIN
        public.branches b ON (u.raw_app_meta_data ->> 'branch_id')::uuid = b.id
    WHERE
        (u.raw_app_meta_data ->> 'tenant_id')::uuid = p_target_tenant_id;
END;
$$;

-- COMMENT: Refactors the get_tenant_users RPC to be compatible with the native Supabase Auth system, fetching user data from auth.users and their assignments from app_metadata.
