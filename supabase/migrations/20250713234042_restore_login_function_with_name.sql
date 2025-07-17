-- This migration updates the login_user function to return the user's name again.

DROP FUNCTION IF EXISTS public.login_user(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.login_user(
    p_email TEXT,
    p_password TEXT
)
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Find the user by email and include the name fields
    SELECT
        u.id, u.password_hash, u.tenant_id, u.branch_id, r.name AS role_name, u.first_name, u.last_name
    INTO
        user_record
    FROM
        public.users u
    JOIN
        public.roles r ON u.role_id = r.id
    WHERE
        u.email = p_email AND u.is_active = TRUE;

    -- Check credentials
    IF user_record.id IS NULL OR user_record.password_hash IS NULL OR public.crypt(p_password, user_record.password_hash) <> user_record.password_hash THEN
        RETURN json_build_object('success', FALSE, 'message', 'Invalid credentials');
    END IF;

    -- Return user data including the name
    RETURN json_build_object(
        'success', TRUE,
        'user_id', user_record.id,
        'email', p_email,
        'role', user_record.role_name,
        'tenant_id', user_record.tenant_id,
        'branch_id', user_record.branch_id,
        'first_name', user_record.first_name,
        'last_name', user_record.last_name
    );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.login_user(TEXT, TEXT) TO public;
