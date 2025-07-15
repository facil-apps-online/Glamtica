-- This migration reverts the database to the last known stable state.

-- 1. Revert the login_user function to its original state without name fields.
DROP FUNCTION IF EXISTS public.login_user(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.login_user(
    p_email TEXT,
    p_password TEXT
)
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT
        u.id, u.password_hash, u.tenant_id, u.branch_id, r.name AS role_name
    INTO
        user_record
    FROM
        public.users u
    JOIN
        public.roles r ON u.role_id = r.id
    WHERE
        u.email = p_email AND u.is_active = TRUE;

    IF user_record.id IS NULL OR user_record.password_hash IS NULL OR public.crypt(p_password, user_record.password_hash) <> user_record.password_hash THEN
        RETURN json_build_object('success', FALSE, 'message', 'Invalid credentials');
    END IF;

    RETURN json_build_object(
        'success', TRUE,
        'user_id', user_record.id,
        'email', p_email,
        'role', user_record.role_name,
        'tenant_id', user_record.tenant_id,
        'branch_id', user_record.branch_id
    );
END;
$$ LANGUAGE plpgsql;
GRANT EXECUTE ON FUNCTION public.login_user(TEXT, TEXT) TO public;

-- 2. Drop the columns that were added to the users table.
ALTER TABLE public.users
DROP COLUMN IF EXISTS first_name,
DROP COLUMN IF EXISTS last_name;

-- 3. Drop the profile update function
DROP FUNCTION IF EXISTS public.update_user_profile(UUID, TEXT, TEXT);
