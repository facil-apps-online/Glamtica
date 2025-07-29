-- Crea una función para buscar a un usuario por su token de recuperación
-- almacenado en user_metadata. También valida que el token no haya expirado.
CREATE OR REPLACE FUNCTION get_user_by_recovery_token(
    p_token TEXT
)
RETURNS TABLE (id UUID, user_metadata JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.raw_user_meta_data
    FROM
        auth.users u
    WHERE
        u.raw_user_meta_data->>'recovery_token' = p_token
        AND (
            (u.raw_user_meta_data->>'recovery_sent_at')::timestamptz > (now() - interval '1 hour')
        );
END;
$$;