-- This migration cleans up all previous versions of the update_user_profile function
-- and creates a single, definitive version to avoid conflicts.

-- 1. Drop all known signatures of the function
DROP FUNCTION IF EXISTS public.update_user_profile(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_user_profile(UUID, TEXT, TEXT);

-- 2. Recreate the one correct version of the function
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
    -- Update the user's information in the public.users table
    UPDATE public.users
    SET
        first_name = p_first_name,
        last_name = p_last_name
    WHERE
        id = p_user_id;

    -- Return a success message
    RETURN json_build_object('success', TRUE, 'message', 'Perfil actualizado correctamente.');

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Ocurrió un error inesperado: %', SQLERRM;
END;
$$;

-- 3. Grant execute permission for the correct function signature
GRANT EXECUTE ON FUNCTION public.update_user_profile(UUID, TEXT, TEXT) TO public;
