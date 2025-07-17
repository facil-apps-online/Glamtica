-- This migration adds debugging notices to the create_tenant_user function.

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
    -- Log received parameters
    RAISE NOTICE '[create_tenant_user] Email: %, RoleID: %, TenantID: %, Requester Role: %', p_email, p_role_id, p_tenant_id, p_requesting_user_role;

    -- 1. Security Check
    IF p_requesting_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Access denied. Super admin role required.';
    END IF;

    -- 2. Create the user in Supabase Auth
    RAISE NOTICE '[create_tenant_user] Inserting into auth.users...';
    INSERT INTO auth.users (email, raw_app_meta_data)
    VALUES (p_email, jsonb_build_object('provider', 'email'))
    RETURNING id INTO new_auth_user_id;
    RAISE NOTICE '[create_tenant_user] Inserted into auth.users with ID: %', new_auth_user_id;

    -- 3. Create the user in the public.users table
    RAISE NOTICE '[create_tenant_user] Inserting into public.users...';
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
    RAISE NOTICE '[create_tenant_user] Inserted into public.users with ID: %', new_public_user_id;

    -- 4. Return a success message
    RETURN json_build_object(
        'success', TRUE,
        'message', 'User created successfully.',
        'userId', new_public_user_id
    );

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'User with this email already exists.';
    WHEN OTHERS THEN
        RAISE WARNING 'Error in create_tenant_user: %', SQLERRM;
        RAISE EXCEPTION 'An unexpected error occurred: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
