-- This migration fixes the user creation logic to work exclusively
-- with the public.users table, aligning with the custom auth system.

CREATE OR REPLACE FUNCTION public.create_tenant_user(
    p_email TEXT,
    p_password TEXT,
    p_role_id UUID,
    p_tenant_id UUID,
    p_requesting_user_role TEXT
)
RETURNS JSON AS $$
DECLARE
    new_public_user_id UUID;
BEGIN
    -- 1. Security Check
    IF p_requesting_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Access denied. Super admin role required.';
    END IF;

    -- 2. Insert directly into public.users, generating a new UUID for the id.
    INSERT INTO public.users (id, email, password_hash, role_id, tenant_id, is_active)
    VALUES (
        gen_random_uuid(), -- Generate the UUID directly
        p_email,
        public.crypt(p_password, public.gen_salt('bf')),
        p_role_id,
        p_tenant_id,
        TRUE
    )
    RETURNING id INTO new_public_user_id;

    -- 3. Return a success message
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
