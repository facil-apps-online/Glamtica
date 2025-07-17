
CREATE OR REPLACE FUNCTION public.set_session_context(
    p_jwt_token TEXT,
    p_jwt_secret TEXT
)
RETURNS VOID AS $$
DECLARE
    claims JSONB;
    user_id_val UUID;
    tenant_id_val UUID;
    branch_id_val UUID;
    role_name_val TEXT;
BEGIN
    IF p_jwt_token IS NULL OR p_jwt_token = '' THEN
        -- Clear session variables if token is null or empty
        PERFORM set_config('app.current_user_id', '', FALSE);
        PERFORM set_config('app.current_tenant_id', '', FALSE);
        PERFORM set_config('app.current_branch_id', '', FALSE);
        PERFORM set_config('app.current_role_name', '', FALSE);
        RETURN;
    END IF;

    -- Decode and verify JWT
    claims := public.verify(p_jwt_token, p_jwt_secret);

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
GRANT EXECUTE ON FUNCTION public.set_session_context(TEXT, TEXT) TO authenticated;
