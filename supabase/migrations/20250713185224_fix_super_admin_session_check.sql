-- This migration fixes the session context function to correctly handle the global super_admin.

DROP FUNCTION IF EXISTS public.set_session_context(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.set_session_context(
    p_jwt_token TEXT,
    p_jwt_secret TEXT
)
RETURNS JSON AS $$
DECLARE
    claims JSONB;
    user_id_val UUID;
    user_is_active BOOLEAN;
    user_role_val TEXT;
BEGIN
    IF p_jwt_token IS NULL OR p_jwt_token = '' THEN
        PERFORM set_config('app.current_user_id', '', FALSE);
        RETURN json_build_object('is_active', false);
    END IF;

    -- Decode JWT
    claims := public.verify(p_jwt_token, p_jwt_secret);
    user_id_val := (claims->>'sub')::UUID;
    user_role_val := claims->>'role';

    -- Set session variables
    PERFORM set_config('app.current_user_id', user_id_val::text, FALSE);
    PERFORM set_config('app.current_role_name', user_role_val, FALSE);

    -- If the user is a super_admin, they are always considered active
    -- and don't need to be checked in the public.users table.
    IF user_role_val = 'super_admin' THEN
        RETURN json_build_object('is_active', true);
    END IF;

    -- For all other roles, check their status in the public.users table
    SELECT is_active INTO user_is_active FROM public.users WHERE id = user_id_val;

    -- Return the active status
    RETURN json_build_object('is_active', COALESCE(user_is_active, false));

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error setting session context: %', SQLERRM;
        PERFORM set_config('app.current_user_id', '', FALSE);
        RETURN json_build_object('is_active', false);
END;
$$ LANGUAGE plpgsql;
