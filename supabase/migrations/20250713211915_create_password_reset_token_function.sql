-- This migration creates the RPC function to generate a password reset token.

CREATE OR REPLACE FUNCTION public.create_password_reset_token(
    p_user_id UUID,
    p_requesting_user_role TEXT
)
RETURNS JSON AS $$
DECLARE
    new_token TEXT;
BEGIN
    -- Security Check
    IF p_requesting_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Access denied. Super admin role required.';
    END IF;

    -- Generate a unique token
    new_token := gen_random_uuid()::text;

    -- Insert the new token into the table, with a 1-hour expiration
    INSERT INTO public.password_reset_tokens (user_id, token, expires_at)
    VALUES (p_user_id, new_token, now() + interval '1 hour');

    -- Return the token to the frontend
    RETURN json_build_object(
        'success', TRUE,
        'token', new_token
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'An unexpected error occurred: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_password_reset_token(UUID, TEXT) TO public;
