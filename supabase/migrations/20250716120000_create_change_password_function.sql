-- Crear la extensión pgcrypto si no existe
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Definición de la función para cambiar la contraseña
CREATE OR REPLACE FUNCTION public.change_password(
    p_user_id UUID,
    p_current_password TEXT,
    p_new_password TEXT
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_user public.users;
    v_password_matches BOOLEAN;
BEGIN
    -- 1. Verificar que el usuario exista
    SELECT * INTO v_user
    FROM public.users u
    WHERE u.id = p_user_id;

    IF v_user IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Usuario no encontrado.';
        RETURN;
    END IF;

    -- 2. Verificar que la contraseña actual sea correcta
    SELECT u.password_hash = crypt(p_current_password, u.password_hash) INTO v_password_matches
    FROM public.users u WHERE u.id = p_user_id;

    IF NOT v_password_matches THEN
        RETURN QUERY SELECT FALSE, 'La contraseña actual es incorrecta.';
        RETURN;
    END IF;

    -- 3. Actualizar con la nueva contraseña
    UPDATE public.users
    SET password_hash = crypt(p_new_password, gen_salt('bf'))
    WHERE id = p_user_id;

    -- 4. Devolver éxito
    RETURN QUERY SELECT TRUE, 'Contraseña actualizada exitosamente.';

EXCEPTION
    WHEN OTHERS THEN
        -- Capturar cualquier otro error
        RETURN QUERY SELECT FALSE, 'Ocurrió un error inesperado al cambiar la contraseña.';
END;
$$;
