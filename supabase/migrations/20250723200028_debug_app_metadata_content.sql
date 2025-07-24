-- MIGRATION: Debug JWT app_metadata content from within PostgreSQL

-- Recreate the helper function to log the entire app_metadata object
DROP FUNCTION IF EXISTS public.get_tenant_id_from_jwt();
CREATE OR REPLACE FUNCTION get_tenant_id_from_jwt()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_app_metadata JSONB;
    v_tenant_id UUID;
BEGIN
    -- Step 1: Extract the entire app_metadata object
    v_app_metadata := (auth.jwt() -> 'app_metadata');

    -- Step 2: Log the content of the object as text for debugging
    RAISE LOG '[get_tenant_id_from_jwt] app_metadata content: %', v_app_metadata::TEXT;

    -- Step 3: Try to extract the tenant_id from the object
    v_tenant_id := (v_app_metadata ->> 'tenant_id')::uuid;

    -- Step 4: If it's still null, then we raise the error
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant ID not found in JWT app_metadata. Logged content above.';
    END IF;
    
    RETURN v_tenant_id;
END;
$$;

-- We need to re-apply the change to get_tenant_branches so it uses the new helper
DROP FUNCTION IF EXISTS public.get_tenant_branches();
CREATE OR REPLACE FUNCTION public.get_tenant_branches()
RETURNS SETOF public.branches
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY SELECT * FROM public.branches WHERE tenant_id = get_tenant_id_from_jwt() ORDER BY is_main_branch DESC, name ASC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_tenant_branches() TO authenticated;
