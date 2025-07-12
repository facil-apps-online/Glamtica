
CREATE OR REPLACE FUNCTION public.set_session_context(
    params JSONB
)
RETURNS VOID AS $$
DECLARE
    jwt_token TEXT;
    claims JSONB;
    user_id_val UUID;
    tenant_id_val UUID;
    branch_id_val UUID;
    role_name_val TEXT;
    jwt_secret TEXT := current_setting('app.jwt_secret', true);
BEGIN
    jwt_token := params->>'jwt_token';

    IF jwt_token IS NULL OR jwt_token = '' THEN
        -- Clear session variables if token is null or empty
        PERFORM set_config('app.current_user_id', '', FALSE);
        PERFORM set_config('app.current_tenant_id', '', FALSE);
        PERFORM set_config('app.current_branch_id', '', FALSE);
        PERFORM set_config('app.current_role_name', '', FALSE);
        RETURN;
    END IF;

    -- Get JWT secret from environment variable (or a secure configuration)
    IF jwt_secret IS NULL OR jwt_secret = '' THEN
        RAISE EXCEPTION 'JWT secret (app.jwt_secret) is not set.';
    END IF;

    -- Decode and verify JWT
    claims := public.verify(jwt_token, jwt_secret);

    -- Extract claims
    user_id_val := (claims->>'sub')::UUID;
    tenant_id_val := (claims->>'tenant_id')::UUID;
    branch_id_val := (claims->>'branch_id')::UUID;
    role_name_val := claims->>'role';

    -- Set session variables
    PERFORM set_config('app.current_user_id', user_id_val::text, FALSE);
    PERFORM set_config('app.current_tenant_id', tenant_id_val::text, FALSE);
    PERFORM set_config('app.current_branch_id', branch_id_val::text, FALSE);
    PERFORM set_config('app.current_role_name', role_name_val::text, FALSE);

EXCEPTION
    WHEN OTHERS THEN
        -- Log error and clear session variables on any exception during JWT processing
        RAISE WARNING 'Error setting session context: %', SQLERRM;
        PERFORM set_config('app.current_user_id', '', FALSE);
        PERFORM set_config('app.current_tenant_id', '', FALSE);
        PERFORM set_config('app.current_branch_id', '', FALSE);
        PERFORM set_config('app.current_role_name', '', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.set_session_context(JSONB) TO authenticated;
