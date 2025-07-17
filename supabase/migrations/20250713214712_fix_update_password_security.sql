-- This migration adds SECURITY DEFINER to the password update function
-- to ensure it has the necessary permissions to modify the users table.

CREATE OR REPLACE FUNCTION public.update_password_with_token(
    p_token TEXT,
    p_new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- <-- AÑADIR ESTA LÍNEA
AS $$
DECLARE
    token_record RECORD;
BEGIN
    -- 1. Find the token in the table
    SELECT * INTO token_record
    FROM public.password_reset_tokens
    WHERE token = p_token;

    -- 2. Validate the token
    IF token_record IS NULL THEN
        RAISE EXCEPTION 'Token inválido o no encontrado.';
    END IF;

    IF token_record.used_at IS NOT NULL THEN
        RAISE EXCEPTION 'Este token ya ha sido utilizado.';
    END IF;

    IF token_record.expires_at < now() THEN
        RAISE EXCEPTION 'Este token ha expirado.';
    END IF;

    -- 3. Update the user's password in the public.users table
    UPDATE public.users
    SET password_hash = public.crypt(p_new_password, public.gen_salt('bf'))
    WHERE id = token_record.user_id;

    -- 4. Mark the token as used
    UPDATE public.password_reset_tokens
    SET used_at = now()
    WHERE id = token_record.id;

    -- 5. Return a success message
    RETURN json_build_object(
        'success', TRUE,
        'message', 'Contraseña actualizada correctamente.'
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Ocurrió un error inesperado: %', SQLERRM;
END;
$$;
