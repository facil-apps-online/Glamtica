-- MIGRATION: Simplify and debug get_tenant_branches

-- Step 1: Drop the unnecessary helper function
DROP FUNCTION IF EXISTS public.get_tenant_id_from_jwt();

-- Step 2: Recreate the main function with simplified logic and logging
DROP FUNCTION IF EXISTS public.get_tenant_branches();
CREATE OR REPLACE FUNCTION public.get_tenant_branches()
RETURNS SETOF public.branches
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Simplified extraction directly inside the function
    v_tenant_id := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;

    -- Log the extracted tenant_id for verification in Supabase DB logs
    RAISE LOG '[get_tenant_branches] Final check - Extracted tenant_id: %', v_tenant_id;

    -- Return the query result
    RETURN QUERY
    SELECT *
    FROM public.branches
    WHERE tenant_id = v_tenant_id
    ORDER BY is_main_branch DESC, name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_branches() TO authenticated;
