-- Migration: Update get_tenant_users function to use the new user_assignments table

-- Step 1: Drop the old function.
DROP FUNCTION IF EXISTS public.get_tenant_users(uuid);

-- Step 2: Create the new, updated get_tenant_users function.
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
  branch_id UUID,
  branch_name TEXT,
  status TEXT,
  default_product_commission_rate NUMERIC,
  default_service_commission_rate NUMERIC
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
        ua.id AS assignment_id,
        u.id AS user_id,
        u.email,
        (u.raw_user_meta_data ->> 'first_name') AS first_name,
        (u.raw_user_meta_data ->> 'last_name') AS last_name,
        r.name AS role_name,
        r.display_name AS role_display_name,
        ua.branch_id,
        b.name AS branch_name,
        ua.status,
        ua.default_product_commission_rate,
        ua.default_service_commission_rate
    FROM
        public.user_assignments ua
    JOIN
        auth.users u ON ua.user_id = u.id
    JOIN
        public.roles r ON ua.role_id = r.id
    LEFT JOIN
        public.branches b ON ua.branch_id = b.id
    WHERE
        ua.tenant_id = p_target_tenant_id;
END;
$$;
