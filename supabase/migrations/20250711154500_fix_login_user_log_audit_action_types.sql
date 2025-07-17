DROP FUNCTION IF EXISTS public.login_user(TEXT, TEXT, INET, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.login_user(TEXT, TEXT, INET, TEXT);

CREATE OR REPLACE FUNCTION public.login_user(
    p_email TEXT,
    p_password TEXT,
    p_request_ip INET DEFAULT NULL, -- IP de la solicitud
    p_user_agent TEXT DEFAULT NULL  -- User-Agent de la solicitud
)
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
    jwt_token TEXT;
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
            p_action := 'user_login_failed'::text, -- Explicit cast to text
            p_object_type := 'users'::text,       -- Explicit cast to text
            p_object_id := user_record.id,
            p_metadata := json_build_object('email', p_email, 'reason', 'Invalid credentials'),
            p_ip_address := p_request_ip,
            p_user_agent := p_user_agent,
            p_tenant_id := user_record.tenant_id,
            p_branch_id := user_record.branch_id
        );
        RETURN json_build_object('success', FALSE, 'message', 'Credenciales inválidas');
    END IF;

    -- Placeholder for JWT generation (will be handled by Edge Function)
    jwt_token := 'PLACEHOLDER_JWT_TOKEN';

    -- Log successful login attempt
    PERFORM public.log_audit_action(
        p_action := 'user_login_success'::text, -- Explicit cast to text
        p_object_type := 'users'::text,       -- Explicit cast to text
        p_object_id := user_record.id,
        p_metadata := json_build_object('email', p_email),
        p_ip_address := p_request_ip,
        p_user_agent := p_user_agent,
        p_tenant_id := user_record.tenant_id,
        p_branch_id := user_record.branch_id
    );

    RETURN json_build_object('success', TRUE, 'token', jwt_token);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage on the function to public (or authenticated) users
GRANT EXECUTE ON FUNCTION public.login_user(TEXT, TEXT, INET, TEXT) TO public;