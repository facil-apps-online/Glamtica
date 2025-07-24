-- MIGRATION: Correct the authentication logic in create_branch function

-- Replaces the existing function with a version that correctly extracts
-- the tenant_id from the JWT, following the project's established pattern.
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
    -- 1. Get the tenant_id using the correct, established pattern
    v_tenant_id := (auth.jwt() ->> 'tenant_id')::uuid;
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant ID not found in JWT claims';
    END IF;

    -- 2. Insert the new branch
    INSERT INTO public.branches (tenant_id, name, address, is_main_branch)
    VALUES (v_tenant_id, branch_name, branch_address, false)
    RETURNING * INTO new_branch;

    -- 3. Return the newly created branch record
    RETURN new_branch;
END;
$$;

COMMENT ON FUNCTION public.create_branch(TEXT, TEXT) IS 'Creates a new non-main branch for the authenticated user''s tenant.';
