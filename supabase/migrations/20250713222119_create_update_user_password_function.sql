-- This function allows an authenticated user to change their own password.

CREATE OR REPLACE FUNCTION public.update_user_password(
    p_old_password TEXT,
    p_new_password TEXT
)
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
    current_user_id UUID;
BEGIN
    -- 1. Get the current user's ID from the session context
    current_user_id := (current_setting('app.current_user_id', TRUE)::uuid);

    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'No active user session found.';
    END IF;

    -- 2. Find the user in the public.users table
    SELECT * INTO user_record
    FROM public.users
    WHERE id = current_user_id;

    -- 3. Verify the old password
    IF user_record.password_hash IS NULL OR public.crypt(p_old_password, user_record.password_hash) <> user_record.password_hash THEN
        RAISE EXCEPTION 'La contraseña actual es incorrecta.';
    END IF;

    -- 4. Update to the new password
    UPDATE public.users
    SET password_hash = public.crypt(p_new_password, public.gen_salt('bf'))
    WHERE id = current_user_id;

    -- 5. Return a success message
    RETURN json_build_object('success', TRUE, 'message', 'Contraseña actualizada correctamente.');

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Ocurrió un error inesperado: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_user_password(TEXT, TEXT) TO public;
