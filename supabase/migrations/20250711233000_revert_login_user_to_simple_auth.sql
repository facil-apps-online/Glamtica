-- supabase/migrations/20250711233000_revert_login_user_to_simple_auth.sql

-- Drop all existing overloads of login_user
DROP FUNCTION IF EXISTS public.login_user(TEXT, TEXT, INET, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.login_user(TEXT, TEXT, INET, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.login_user(TEXT, TEXT, INET, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.login_user(TEXT, TEXT, INET, TEXT);
DROP FUNCTION IF EXISTS public.login_user(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.login_user();

-- Recreate a simplified login_user function
CREATE OR REPLACE FUNCTION public.login_user(
    p_email TEXT,
    p_password TEXT,
    p_request_ip INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Find the user by email
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

    -- Check if user exists and password is correct
    IF user_record.id IS NULL OR user_record.password_hash IS NULL OR public.crypt(p_password, user_record.password_hash) <> user_record.password_hash THEN
        -- Log failed login attempt
        PERFORM public.log_audit_action(
            p_action := 'user_login_failed'::text,
            p_object_type := 'users'::text,
            p_object_id := user_record.id,
            p_metadata := json_build_object('email', p_email, 'reason', 'Invalid credentials')::jsonb,
            p_ip_address := p_request_ip,
            p_user_agent := p_user_agent,
            p_tenant_id := user_record.tenant_id,
            p_branch_id := user_record.branch_id
        );
        RETURN json_build_object('success', FALSE, 'message', 'Credenciales inválidas');
    END IF;

    -- Log successful login attempt
    PERFORM public.log_audit_action(
        p_action := 'user_login_success'::text,
        p_object_type := 'users'::text,
        p_object_id := user_record.id,
        p_metadata := json_build_object('email', p_email)::jsonb,
        p_ip_address := p_request_ip,
        p_user_agent := p_user_agent,
        p_tenant_id := user_record.tenant_id,
        p_branch_id := user_record.branch_id
    );

    -- Return user data for frontend to generate JWT
    RETURN json_build_object(
        'success', TRUE,
        'user_id', user_record.id,
        'email', p_email,
        'role', user_record.role_name,
        'tenant_id', user_record.tenant_id,
        'branch_id', user_record.branch_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage on the new function signature
GRANT EXECUTE ON FUNCTION public.login_user(TEXT, TEXT, INET, TEXT) TO public;
