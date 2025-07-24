-- MIGRATION: Add debug logging to get_tenant_branches

-- Recreate the function to include a log statement
DROP FUNCTION IF EXISTS public.get_tenant_branches();
CREATE OR REPLACE FUNCTION public.get_tenant_branches()
RETURNS SETOF public.branches
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    v_tenant_id := (auth.jwt() ->> 'tenant_id')::uuid;
    
    -- DEBUG: Log the tenant_id extracted from the JWT
    RAISE LOG '[get_tenant_branches] Authenticated with tenant_id: %', v_tenant_id;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant ID not found in JWT claims';
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.branches
    WHERE tenant_id = v_tenant_id
    ORDER BY is_main_branch DESC, name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_branches() TO authenticated;
