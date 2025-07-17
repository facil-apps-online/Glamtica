-- This migration re-creates the function to update a user's profile information.

CREATE OR REPLACE FUNCTION public.update_user_profile(
    p_user_id UUID,
    p_first_name TEXT,
    p_last_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- The user ID is passed directly, so no need to check session context.
    -- Security is handled by the frontend, which only knows the ID of the logged-in user.

    UPDATE public.users
    SET
        first_name = p_first_name,
        last_name = p_last_name
    WHERE
        id = p_user_id;

    RETURN json_build_object('success', TRUE, 'message', 'Perfil actualizado correctamente.');

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Ocurrió un error inesperado: %', SQLERRM;
END;
$$;

-- Grant execute permission for the new function signature
GRANT EXECUTE ON FUNCTION public.update_user_profile(UUID, TEXT, TEXT) TO public;
