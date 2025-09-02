-- Migration: Updates the get_hydrated_user_assignments RPC to read from user_assignments table.

-- Step 1: Drop the old function to be safe.
DROP FUNCTION IF EXISTS public.get_hydrated_user_assignments(uuid);

-- Step 2: Create the function with the corrected logic.
CREATE OR REPLACE FUNCTION public.get_hydrated_user_assignments(p_user_id uuid)
RETURNS TABLE (
    assignment_id uuid,
    tenant_id uuid,
    role_id uuid,
    branch_id uuid,
    status text,
    tenant_name text,
    role_name text,
    role_display_name text,
    branch_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ua.id AS assignment_id, -- Assuming 'id' in user_assignments is the assignment_id
        ua.tenant_id,
        ua.role_id,
        ua.branch_id,
        ua.status,
        t.name AS tenant_name,
        r.name AS role_name,
        r.display_name AS role_display_name,
        b.name AS branch_name
    FROM
        public.user_assignments ua -- Querying the new table directly
    LEFT JOIN tenants t ON ua.tenant_id = t.id
    LEFT JOIN roles r ON ua.role_id = r.id
    LEFT JOIN branches b ON ua.branch_id = b.id
    WHERE
        ua.user_id = p_user_id;
END;
$$;