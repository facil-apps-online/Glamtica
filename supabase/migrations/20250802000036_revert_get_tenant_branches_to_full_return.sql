-- MIGRATION: Revert get_tenant_branches to return all columns and get tenant_id from JWT

-- Drop the existing function (with parameter) if it exists
DROP FUNCTION IF EXISTS public.get_tenant_branches(uuid);

-- Recreate the get_tenant_branches function as it was in 20250723200029_simplify_and_debug_get_tenant_branches.sql
CREATE OR REPLACE FUNCTION public.get_tenant_branches()
RETURNS SETOF public.branches
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Extract tenant_id directly from the JWT
    v_tenant_id := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;

    -- Log the extracted tenant_id for verification
    RAISE LOG '[get_tenant_branches] Reverted - Extracted tenant_id: %', v_tenant_id;

    -- Return all columns from public.branches for the given tenant_id
    RETURN QUERY
    SELECT *
    FROM public.branches
    WHERE tenant_id = v_tenant_id
    ORDER BY is_main_branch DESC, name ASC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_tenant_branches() TO authenticated;
