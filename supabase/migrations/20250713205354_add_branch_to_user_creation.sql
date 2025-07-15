-- Migration to add branch selection to the user creation flow

-- 1. Create a new function to get branches for a specific tenant
CREATE OR REPLACE FUNCTION public.get_tenant_branches(
    p_tenant_id UUID,
    p_requesting_user_role TEXT
)
RETURNS TABLE (id uuid, name text) AS $$
BEGIN
    -- Security Check
    IF p_requesting_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Access denied. Super admin role required.';
    END IF;

    -- Return branches for the given tenant
    RETURN QUERY
    SELECT b.id, b.name
    FROM public.branches b
    WHERE b.tenant_id = p_tenant_id
    ORDER BY b.name;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.get_tenant_branches(UUID, TEXT) TO public;


-- 2. Update the create_tenant_user function to accept a branch_id
DROP FUNCTION IF EXISTS public.create_tenant_user(TEXT, TEXT, UUID, UUID, TEXT);
CREATE OR REPLACE FUNCTION public.create_tenant_user(
    p_email TEXT,
    p_password TEXT,
    p_role_id UUID,
    p_tenant_id UUID,
    p_branch_id UUID, -- Nuevo parámetro
    p_requesting_user_role TEXT
)
RETURNS JSON AS $$
DECLARE
    new_public_user_id UUID;
BEGIN
    -- Security Check
    IF p_requesting_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Access denied. Super admin role required.';
    END IF;

    -- Insert into public.users with the new branch_id
    INSERT INTO public.users (id, email, password_hash, role_id, tenant_id, branch_id, is_active)
    VALUES (
        gen_random_uuid(),
        p_email,
        public.crypt(p_password, public.gen_salt('bf')),
        p_role_id,
        p_tenant_id,
        p_branch_id, -- Usar el nuevo parámetro
        TRUE
    )
    RETURNING id INTO new_public_user_id;

    -- Return a success message
    RETURN json_build_object(
        'success', TRUE,
        'message', 'User created successfully.',
        'userId', new_public_user_id
    );

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'User with this email already exists.';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'An unexpected error occurred: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.create_tenant_user(TEXT, TEXT, UUID, UUID, UUID, TEXT) TO public;
