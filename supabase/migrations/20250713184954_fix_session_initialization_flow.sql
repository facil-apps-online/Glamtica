-- Step 1: Drop the problematic session status function
DROP FUNCTION IF EXISTS public.get_session_status();

-- Step 2: Enhance the set_session_context function to return the user's active status
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
BEGIN
    IF p_jwt_token IS NULL OR p_jwt_token = '' THEN
        PERFORM set_config('app.current_user_id', '', FALSE);
        RETURN json_build_object('is_active', false);
    END IF;

    -- Decode JWT
    claims := public.verify(p_jwt_token, p_jwt_secret);
    user_id_val := (claims->>'sub')::UUID;

    -- Set session variables
    PERFORM set_config('app.current_user_id', user_id_val::text, FALSE);
    PERFORM set_config('app.current_role_name', (claims->>'role')::text, FALSE);

    -- Check the user's active status from the database
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
