-- This migration adds debugging notices to the update_user_profile function.

CREATE OR REPLACE FUNCTION public.update_user_profile(
    p_first_name TEXT,
    p_last_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id_text TEXT;
    current_user_id UUID;
BEGIN
    -- Log the input parameters
    RAISE NOTICE '[update_user_profile] Received first_name: %, last_name: %', p_first_name, p_last_name;

    -- Get the user ID from the session variable
    current_user_id_text := current_setting('app.current_user_id', TRUE);
    RAISE NOTICE '[update_user_profile] current_user_id from session: %', current_user_id_text;

    IF current_user_id_text IS NULL OR current_user_id_text = '' THEN
        RAISE EXCEPTION 'No active user session found.';
    END IF;

    current_user_id := current_user_id_text::uuid;

    -- Update the user's information
    UPDATE public.users
    SET
        first_name = p_first_name,
        last_name = p_last_name
    WHERE
        id = current_user_id;

    RAISE NOTICE '[update_user_profile] Profile updated for user ID: %', current_user_id;

    -- Return a success message
    RETURN json_build_object('success', TRUE, 'message', 'Perfil actualizado correctamente.');

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in update_user_profile: %', SQLERRM;
        RAISE EXCEPTION 'An unexpected error occurred: %', SQLERRM;
END;
$$;
