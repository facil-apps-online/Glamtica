-- This function creates a new user in both the custom public.users table
-- and the Supabase auth.users table.

CREATE OR REPLACE FUNCTION public.create_tenant_user(
    p_email TEXT,
    p_password TEXT,
    p_role_id UUID,
    p_tenant_id UUID,
    p_requesting_user_role TEXT
)
RETURNS JSON AS $$
DECLARE
    new_auth_user_id UUID;
    new_public_user_id UUID;
BEGIN
    -- 1. Security Check
    IF p_requesting_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Access denied. Super admin role required.';
    END IF;

    -- 2. Create the user in Supabase Auth to get a valid user ID
    -- We create it without a password initially, as our system uses a separate password hash.
    INSERT INTO auth.users (email, raw_app_meta_data)
    VALUES (p_email, jsonb_build_object('provider', 'email'))
    RETURNING id INTO new_auth_user_id;

    -- 3. Create the user in the public.users table
    INSERT INTO public.users (id, email, password_hash, role_id, tenant_id, is_active)
    VALUES (
        new_auth_user_id,
        p_email,
        public.crypt(p_password, public.gen_salt('bf')),
        p_role_id,
        p_tenant_id,
        TRUE
    )
    RETURNING id INTO new_public_user_id;

    -- 4. Return a success message with the new user's ID
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_tenant_user(TEXT, TEXT, UUID, UUID, TEXT) TO public;
