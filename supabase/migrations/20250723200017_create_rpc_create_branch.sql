-- MIGRATION: Create RPC function to create a new branch

CREATE OR REPLACE FUNCTION public.create_branch(
    branch_name TEXT,
    branch_address TEXT DEFAULT NULL
)
RETURNS public.branches
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
    new_branch public.branches;
BEGIN
    -- 1. Get the tenant_id from the authenticated user's JWT claims
    SELECT jwt.claims->>'tenant_id' INTO v_tenant_id FROM auth.jwt() jwt;
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant ID not found in JWT claims';
    END IF;

    -- 2. Insert the new branch, ensuring it's not the main one
    INSERT INTO public.branches (tenant_id, name, address, is_main_branch)
    VALUES (v_tenant_id, branch_name, branch_address, false)
    RETURNING * INTO new_branch;

    -- 3. The 'status' will default to 'pending_activation' and the trigger
    --    will automatically create the first history record.

    -- 4. Return the newly created branch record
    RETURN new_branch;
END;
$$;

COMMENT ON FUNCTION public.create_branch(TEXT, TEXT) IS 'Creates a new non-main branch for the authenticated user''s tenant.';
