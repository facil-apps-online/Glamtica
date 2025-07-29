-- Paso 1: Eliminar la función existente para permitir el cambio de tipo de retorno.
DROP FUNCTION IF EXISTS create_password_reset_token(TEXT);

-- Paso 2: Volver a crear la función con la lógica y el tipo de retorno correctos (JSONB).
CREATE OR REPLACE FUNCTION create_password_reset_token(
    p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_token TEXT;
BEGIN
    -- Buscar el ID del usuario a partir de su email.
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;

    -- Si no se encuentra el usuario, devolver un JSON de error.
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'No se encontró un usuario con ese correo electrónico.'
        );
    END IF;

    -- Generar y guardar el token de recuperación.
    v_token := gen_random_uuid()::text;
    UPDATE auth.users
    SET
        recovery_token = v_token,
        recovery_sent_at = now()
    WHERE id = v_user_id;

    -- Devolver un JSON de éxito con el token.
    RETURN jsonb_build_object(
        'success', TRUE,
        'token', v_token
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', SQLERRM
        );
END;
$$;