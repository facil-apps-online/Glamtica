-- supabase/migrations/20250711231500_fix_login_user_payload_construction.sql

-- Recreate the function, constructing the payload directly within request_data_jsonb
CREATE OR REPLACE FUNCTION public.login_user(
    p_email TEXT,
    p_password TEXT,
    p_request_ip INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_jwt_secret TEXT DEFAULT NULL,
    p_audience TEXT DEFAULT NULL,
    p_supabase_anon_key TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
    jwt_token TEXT;
    jwt_secret_val TEXT;
    edge_function_url TEXT;
    http_response_record RECORD;
    edge_function_response_json JSON;
    request_data_jsonb JSONB; -- Combined JSONB for payload and headers
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

    -- Construct Edge Function URL
    edge_function_url := 'https://vtfsbogpkrcbfuhhoepf.supabase.co/functions/v1/generate-jwt';

    -- DEBUG: Check the value of p_supabase_anon_key
    RAISE NOTICE 'DEBUG: p_supabase_anon_key = %', p_supabase_anon_key;

    -- Combine payload and headers into a single JSONB object for http_post(uri, data jsonb)
    request_data_jsonb := jsonb_build_object(
        'body', jsonb_build_object( -- The actual request body for the Edge Function
            'user_id', user_record.id,
            'email', p_email,
            'role', user_record.role_name,
            'tenant_id', user_record.tenant_id,
            'branch_id', user_record.branch_id,
            'jwt_secret', jwt_secret_val,
            'audience', p_audience
        ),
        'headers', jsonb_build_object('apikey', p_supabase_anon_key) -- Headers as a nested JSONB object
    );

    -- Call Edge Function to generate JWT using http_post(uri, data jsonb)
    SELECT * FROM public.http_post(
        edge_function_url::character varying,
        request_data_jsonb -- Pass the combined JSONB object
    ) INTO http_response_record;

    -- Check HTTP status and parse response content
    IF http_response_record.status <> 200 THEN
        RAISE EXCEPTION 'Failed to generate JWT: Status %, Content: %', http_response_record.status, http_response_record.content;
    END IF;

    -- Parse the content as JSON
    edge_function_response_json := http_response_record.content::json;

    -- Extract the token
    jwt_token := edge_function_response_json->>'token';

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

    RETURN json_build_object('success', TRUE, 'token', jwt_token);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage on the new function signature
GRANT EXECUTE ON FUNCTION public.login_user(TEXT, TEXT, INET, TEXT, TEXT, TEXT, TEXT) TO public;
