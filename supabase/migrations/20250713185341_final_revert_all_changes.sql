-- This migration reverts all function changes made during the debugging session.

-- Drop all created/modified functions
DROP FUNCTION IF EXISTS public.get_tenant_users(uuid, text);
DROP FUNCTION IF EXISTS public.get_tenant_users(uuid);
DROP FUNCTION IF EXISTS public.update_user_active_status(uuid, boolean, text);
DROP FUNCTION IF EXISTS public.get_session_status();
DROP FUNCTION IF EXISTS public.set_session_context(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.is_valid_uuid(text);

-- Restore the original login_user function from the last known good state
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
