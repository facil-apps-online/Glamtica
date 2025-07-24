-- MIGRATION: Final correction for get_tenant_branches RPC function

-- Step 1: Drop any and all existing versions of the function to prevent conflicts.
-- This handles versions with or without parameters.
DROP FUNCTION IF EXISTS public.get_tenant_branches();
DROP FUNCTION IF EXISTS public.get_tenant_branches(UUID);

-- Step 2: Create the definitive version of the function.
-- It takes no parameters and gets the tenant_id from the JWT.
CREATE OR REPLACE FUNCTION public.get_tenant_branches()
RETURNS SETOF public.branches
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    v_tenant_id := (auth.jwt() ->> 'tenant_id')::uuid;
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

-- Step 3: Re-grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_tenant_branches() TO authenticated;

COMMENT ON FUNCTION public.get_tenant_branches() IS 'Returns all branches for the caller''s tenant. (V2 - No params)';
