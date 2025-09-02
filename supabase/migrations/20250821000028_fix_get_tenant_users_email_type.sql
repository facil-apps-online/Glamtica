-- Migration: 20250821000028_fix_get_tenant_users_email_type.sql
-- Description: Fixes the type mismatch for the email column in get_tenant_users function.

DROP FUNCTION IF EXISTS public.get_tenant_users(uuid);

CREATE OR REPLACE FUNCTION public.get_tenant_users(
  p_target_tenant_id UUID
)
RETURNS TABLE (
  assignment_id UUID,
  user_id UUID,
  email TEXT, -- Expected TEXT
  first_name TEXT,
  last_name TEXT,
  role_name TEXT,
  role_display_name TEXT,
  branch_id UUID,
  branch_name TEXT,
  status TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_caller_assignments JSONB := (auth.jwt() -> 'app_metadata' -> 'assignments');
    v_caller_tenant_ids UUID[];
BEGIN
    -- Get all tenant_ids the caller is assigned to
    SELECT array_agg(DISTINCT (elem ->> 'tenant_id')::uuid)
    FROM jsonb_array_elements(v_caller_assignments) as elem
    INTO v_caller_tenant_ids;

    -- If the requested tenant_id is not in the list of the caller's tenants, deny access.
    IF NOT (p_target_tenant_id = ANY(v_caller_tenant_ids)) THEN
        RAISE EXCEPTION 'Access denied: You do not have permission to view users for this tenant.';
    END IF;

    -- Main Query
    RETURN QUERY
    SELECT
        (assignment ->> 'assignment_id')::uuid,
        u.id AS user_id,
        u.email::TEXT, -- Cast to TEXT
        (u.raw_user_meta_data ->> 'first_name')::TEXT,
        (u.raw_user_meta_data ->> 'last_name')::TEXT,
        (assignment ->> 'role')::TEXT,
        r.display_name::TEXT,
        (assignment ->> 'branch_id')::uuid,
        b.name::TEXT,
        (assignment ->> 'status')::TEXT
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
