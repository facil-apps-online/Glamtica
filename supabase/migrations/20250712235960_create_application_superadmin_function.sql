CREATE OR REPLACE FUNCTION public.create_application_superadmin(
    admin_email TEXT,
    admin_password TEXT
)
RETURNS UUID AS $$
DECLARE
    super_admin_role_id UUID;
    new_user_id UUID;
BEGIN
    -- Get the role_id for 'super_admin'
    SELECT id INTO super_admin_role_id FROM public.roles WHERE name = 'super_admin';

    IF super_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Role "super_admin" not found.';
    END IF;

    -- Insert the new application superadmin user
    INSERT INTO public.users (
        email,
        password_hash,
        role_id,
        is_active
    )
    VALUES (
        admin_email,
        crypt(admin_password, gen_salt('bf')),
        super_admin_role_id,
        TRUE
    )
    RETURNING id INTO new_user_id;

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage on the function to anon users (for initial setup)
GRANT EXECUTE ON FUNCTION public.create_application_superadmin TO anon;