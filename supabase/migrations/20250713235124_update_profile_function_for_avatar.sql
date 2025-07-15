-- This migration updates the profile update function to include the avatar_url.

DROP FUNCTION IF EXISTS public.update_user_profile(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.update_user_profile(
    p_user_id UUID,
    p_first_name TEXT,
    p_last_name TEXT,
    p_avatar_url TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.users
    SET
        first_name = p_first_name,
        last_name = p_last_name,
        avatar_url = p_avatar_url
    WHERE
        id = p_user_id;

    RETURN json_build_object('success', TRUE, 'message', 'Perfil actualizado correctamente.');

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Ocurrió un error inesperado: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_profile(UUID, TEXT, TEXT, TEXT) TO public;
