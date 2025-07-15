-- This function allows a user to update their own profile information.

CREATE OR REPLACE FUNCTION public.update_user_profile(
    p_first_name TEXT,
    p_last_name TEXT
)
RETURNS JSON AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- 1. Get the current user's ID from the session context
    current_user_id := (current_setting('app.current_user_id', TRUE)::uuid);

    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'No active user session found.';
    END IF;

    -- 2. Update the user's information in the public.users table
    UPDATE public.users
    SET
        first_name = p_first_name,
        last_name = p_last_name
    WHERE
        id = current_user_id;

    -- 3. Return a success message
    RETURN json_build_object('success', TRUE, 'message', 'Perfil actualizado correctamente.');

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Ocurrió un error inesperado: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_user_profile(TEXT, TEXT) TO public;
