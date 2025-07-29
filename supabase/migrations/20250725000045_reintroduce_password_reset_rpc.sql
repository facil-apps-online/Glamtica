-- Reintroduce la función para crear un token de reseteo de contraseña,
-- pero adaptada para ser llamada desde el login (usando email) y sin
-- la validación de rol manual que ya no es necesaria.
CREATE OR REPLACE FUNCTION create_password_reset_token(
    p_email TEXT
)
RETURNS TABLE (success BOOLEAN, token TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- 1. Buscar el ID del usuario a partir de su email.
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;

    -- 2. Si no se encuentra el usuario, devolver un fallo.
    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'No se encontró un usuario con ese correo electrónico.';
        RETURN;
    END IF;

    -- 3. Generar y guardar el token de recuperación en auth.users.
    --    Supabase maneja la lógica de expiración.
    UPDATE auth.users
    SET
        recovery_token = gen_random_uuid()::text,
        recovery_sent_at = now()
    WHERE id = v_user_id;

    -- 4. Devolver el token generado para que el frontend pueda construir el enlace.
    --    NOTA: Esto es para tu caso de uso específico de "ver el enlace".
    --    En un flujo normal, este token no se expondría directamente.
    RETURN QUERY
    SELECT TRUE, u.recovery_token
    FROM auth.users u
    WHERE u.id = v_user_id;

END;
$$;