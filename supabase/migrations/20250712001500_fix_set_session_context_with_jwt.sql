-- supabase/migrations/20250712001500_fix_set_session_context_with_jwt.sql

DROP FUNCTION IF EXISTS public.set_session_context(TEXT);

CREATE OR REPLACE FUNCTION public.set_session_context(
    jwt_token TEXT
)
RETURNS VOID AS $$
DECLARE
    claims JSONB;
    user_id_val UUID;
    tenant_id_val UUID;
    branch_id_val UUID;
    role_name_val TEXT;
BEGIN
    -- Verify the JWT and extract claims
    -- Assumes the JWT is signed with the project's JWT secret
    claims := auth.jwt_verify(jwt_token);

    user_id_val := (claims->>'sub')::UUID;
    tenant_id_val := (claims->>'tenant_id')::UUID;
    branch_id_val := (claims->>'branch_id')::UUID;
    role_name_val := claims->>'role';

    IF user_id_val IS NOT NULL THEN
        -- Set session variables
        PERFORM set_config('app.current_user_id', user_id_val::text, FALSE);
        PERFORM set_config('app.current_tenant_id', tenant_id_val::text, FALSE);
        PERFORM set_config('app.current_branch_id', branch_id_val::text, FALSE);
        PERFORM set_config('app.current_role_name', role_name_val::text, FALSE);
    ELSE
        -- Clear session variables if JWT is invalid or user_id is not found
        PERFORM set_config('app.current_user_id', '', FALSE);
        PERFORM set_config('app.current_tenant_id', '', FALSE);
        PERFORM set_config('app.current_branch_id', '', FALSE);
        PERFORM set_config('app.current_role_name', '', FALSE);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.set_session_context(TEXT) TO authenticated;
