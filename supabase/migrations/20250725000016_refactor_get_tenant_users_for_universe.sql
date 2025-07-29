-- Migration: 20250725000016_refactor_get_tenant_users_for_universe.sql
-- Description: Refactors the get_tenant_users RPC to support the new "Universe" architecture
-- with a multi-assignment array in the user's app_metadata.

-- Step 1: Drop the old function.
DROP FUNCTION IF EXISTS public.get_tenant_users(uuid);

-- Step 2: Create the new, refactored get_tenant_users function.
CREATE OR REPLACE FUNCTION public.get_tenant_users(
  p_target_tenant_id UUID
)
RETURNS TABLE (
  assignment_id UUID,
  user_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role_name TEXT,
  role_display_name TEXT,
  branch_name TEXT,
  status TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_caller_assignments JSONB := (auth.jwt() -> 'app_metadata' -> 'assignments');
    v_caller_is_super_admin BOOLEAN;
    v_caller_can_access_tenant BOOLEAN;
BEGIN
    -- Step 2a: Authorization Check
    -- Check if the caller has a 'super_admin' role in any of their assignments.
    SELECT EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_caller_assignments) as elem WHERE elem ->> 'role' = 'super_admin'
    ) INTO v_caller_is_super_admin;

    -- Check if the caller has an admin role for the specific tenant they are requesting.
    SELECT EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_caller_assignments) as elem
        WHERE (elem ->> 'tenant_id')::uuid = p_target_tenant_id
          AND elem ->> 'role' IN ('tenant_super_admin', 'tenant_admin')
    ) INTO v_caller_can_access_tenant;

    -- If the caller is not a super_admin and does not have specific rights to this tenant, deny access.
    IF NOT (v_caller_is_super_admin OR v_caller_can_access_tenant) THEN
        RAISE EXCEPTION 'Access denied: You do not have permission to view users for this tenant.';
    END IF;

    -- Step 2b: Main Query
    -- Unnest the assignments array for all users to find those belonging to the target tenant.
    RETURN QUERY
    SELECT
        (assignment ->> 'assignment_id')::uuid,
        u.id AS user_id,
        u.email,
        (u.raw_user_meta_data ->> 'first_name') AS first_name,
        (u.raw_user_meta_data ->> 'last_name') AS last_name,
        (assignment ->> 'role') AS role_name,
        r.display_name AS role_display_name,
        b.name AS branch_name,
        (assignment ->> 'status') AS status
    FROM
        auth.users u,
        jsonb_array_elements(u.raw_app_meta_data -> 'assignments') AS assignment
    LEFT JOIN
        public.roles r ON (assignment ->> 'role') = r.name
    LEFT JOIN
        public.branches b ON (assignment ->> 'branch_id')::uuid = b.id
    WHERE
        (assignment ->> 'tenant_id')::uuid = p_target_tenant_id;
END;
$$;

-- COMMENT: Refactors the get_tenant_users RPC to work with the multi-assignment array in app_metadata, enabling the "Universe" architecture.
