DROP FUNCTION IF EXISTS public.login_user; -- Drops all overloads of login_user

CREATE OR REPLACE FUNCTION public.login_user(
    p_email TEXT,
    p_password TEXT,
    p_request_ip INET DEFAULT NULL, -- IP de la solicitud
    p_user_agent TEXT DEFAULT NULL,  -- User-Agent de la solicitud
    p_jwt_secret TEXT DEFAULT NULL   -- JWT Secret (temporalmente desde frontend)
)
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
    jwt_token TEXT;
    jwt_secret_val TEXT;
    edge_function_url TEXT;
    http_response_content TEXT; -- Changed to TEXT to capture raw response
    edge_function_response_json JSON; -- Still declared as JSON for later use, but not directly cast here
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

    -- Use the provided JWT secret parameter
    jwt_secret_val := p_jwt_secret;

    IF jwt_secret_val IS NULL OR jwt_secret_val = '' THEN
        RAISE EXCEPTION 'JWT secret is not provided to the function.';
    END IF;

    -- Construct Edge Function URL (hardcoded for now, will be passed from frontend)
    edge_function_url := 'https://vtfsbogpkrcbfuhhoepf.supabase.co/functions/v1/generate-jwt'; -- HARDCODED FOR DEBUGGING

    -- Call Edge Function to generate JWT
    SELECT http_post(
        edge_function_url,
        json_build_object(
            'user_id', user_record.id,
            'email', p_email,
            'role', user_record.role_name,
            'tenant_id', user_record.tenant_id,
            'branch_id', user_record.branch_id,
            'jwt_secret', jwt_secret_val
        )::text,
        'application/json'
    ) INTO http_response_content; -- Store as TEXT

    -- DEBUG: Raise exception to see the raw HTTP response content
    RAISE EXCEPTION 'Raw HTTP Response: %', http_response_content;

    -- The rest of the function will not be reached for now
    -- IF edge_function_response->>'status' <> '200' THEN
    --     RAISE EXCEPTION 'Failed to generate JWT: %', edge_function_response->>'content';
    -- END IF;

    -- jwt_token := edge_function_response->'content'->>'token';

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

    RETURN json_build_object('success', TRUE, 'token', 'DEBUG_TOKEN_PLACEHOLDER'); -- Return placeholder for now
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage on the function to public (or authenticated) users
GRANT EXECUTE ON FUNCTION public.login_user(TEXT, TEXT, INET, TEXT, TEXT) TO public;