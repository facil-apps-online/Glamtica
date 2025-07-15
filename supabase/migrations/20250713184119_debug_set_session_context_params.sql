-- This migration adds debugging notices to the set_session_context function.

CREATE OR REPLACE FUNCTION public.set_session_context(
    p_jwt_token TEXT,
    p_jwt_secret TEXT
)
RETURNS VOID AS $$
DECLARE
    claims JSONB;
BEGIN
    -- Log received parameters
    RAISE NOTICE '[set_session_context] Received token (first 10 chars): %', LEFT(p_jwt_token, 10);
    RAISE NOTICE '[set_session_context] Received secret (is null?): %', p_jwt_secret IS NULL;

    IF p_jwt_token IS NULL OR p_jwt_token = '' THEN
        PERFORM set_config('app.current_user_id', '', FALSE);
        RETURN;
    END IF;

    -- Decode and verify JWT
    claims := public.verify(p_jwt_token, p_jwt_secret);
    RAISE NOTICE '[set_session_context] Decoded claims: %', claims;

    -- Set session variables
    PERFORM set_config('app.current_user_id', (claims->>'sub')::text, FALSE);
    PERFORM set_config('app.current_role_name', (claims->>'role')::text, FALSE);

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '[set_session_context] Error: %', SQLERRM;
        PERFORM set_config('app.current_user_id', '', FALSE);
END;
$$ LANGUAGE plpgsql;
