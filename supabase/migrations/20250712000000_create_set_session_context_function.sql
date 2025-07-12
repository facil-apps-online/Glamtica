-- supabase/migrations/20250712000000_create_set_session_context_function.sql

CREATE OR REPLACE FUNCTION public.set_session_context(
    session_token TEXT
)
RETURNS VOID AS $$
DECLARE
    user_id_val UUID;
    tenant_id_val UUID;
    branch_id_val UUID;
    role_name_val TEXT;
BEGIN
    -- Retrieve user, tenant, branch, and role information from the session token
    -- This assumes the session_token is a JWT that contains these claims.
    -- In a real application, you would verify the JWT and extract claims.
    -- For now, we'll simulate by looking up the user based on the token.

    SELECT
        us.user_id,
        u.tenant_id,
        u.branch_id,
        r.name AS role_name
    INTO
        user_id_val,
        tenant_id_val,
        branch_id_val,
        role_name_val
    FROM
        public.user_sessions us
    JOIN
        public.users u ON us.user_id = u.id
    JOIN
        public.roles r ON u.role_id = r.id
    WHERE
        us.token = session_token AND us.is_active = TRUE AND us.expires_at > now();

    IF user_id_val IS NOT NULL THEN
        -- Set session variables
        PERFORM set_config('app.current_user_id', user_id_val::text, FALSE);
        PERFORM set_config('app.current_tenant_id', tenant_id_val::text, FALSE);
        PERFORM set_config('app.current_branch_id', branch_id_val::text, FALSE);
        PERFORM set_config('app.current_role_name', role_name_val::text, FALSE);
    ELSE
        -- Clear session variables if token is invalid or expired
        PERFORM set_config('app.current_user_id', '', FALSE);
        PERFORM set_config('app.current_tenant_id', '', FALSE);
        PERFORM set_config('app.current_branch_id', '', FALSE);
        PERFORM set_config('app.current_role_name', '', FALSE);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.set_session_context(TEXT) TO authenticated;
