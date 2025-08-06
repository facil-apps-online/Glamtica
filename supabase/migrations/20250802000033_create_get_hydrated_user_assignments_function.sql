-- Create the get_hydrated_user_assignments function to efficiently fetch and join user assignment data.
-- This function reads the assignments from the user's app_metadata, expands them,
-- and joins them with the corresponding tables to return fully "hydrated" data in a single query.
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
        a.assignment_id,
        a.tenant_id,
        a.role_id,
        a.branch_id,
        a.status,
        t.name AS tenant_name,
        r.name AS role_name,
        r.display_name AS role_display_name,
        b.name AS branch_name
    FROM
        auth.users u,
        -- Expand the JSON array of assignments into a recordset
        jsonb_to_recordset(u.raw_app_meta_data->'assignments') AS a(
            assignment_id uuid,
            tenant_id uuid,
            role_id uuid,
            branch_id uuid,
            status text
        )
    -- Join with other tables to get the names
    LEFT JOIN tenants t ON a.tenant_id = t.id
    LEFT JOIN roles r ON a.role_id = r.id
    LEFT JOIN branches b ON a.branch_id = b.id
    WHERE
        u.id = p_user_id;
END;
$$;
