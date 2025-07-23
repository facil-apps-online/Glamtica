-- Migración para revertir la función login_user a un estado estable y funcional,
-- manteniendo la adición del tenant_name.

DROP FUNCTION IF EXISTS public.login_user(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.login_user(
    p_email TEXT,
    p_password TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    user_record RECORD;
    login_data jsonb;
BEGIN
    -- Se busca al usuario y se obtienen todos los datos necesarios en una sola consulta.
    -- Se usa LEFT JOIN para el tenant para asegurar que no falle si el usuario (ej. super_admin) no tiene uno.
    SELECT
        u.id,
        u.password_hash,
        u.tenant_id,
        u.branch_id,
        r.name as role_name,
        u.first_name,
        u.last_name,
        u.avatar_url,
        t.name as tenant_name
    INTO
        user_record
    FROM
        public.users u
    JOIN
        public.roles r ON u.role_id = r.id
    LEFT JOIN
        public.tenants t ON u.tenant_id = t.id
    WHERE
        u.email = p_email AND u.is_active = TRUE;

    -- Si no se encuentra el usuario o la contraseña no coincide, se devuelve un error.
    -- Esta es la lógica de verificación que ha demostrado ser estable.
    IF user_record.id IS NULL OR user_record.password_hash IS NULL OR crypt(p_password, user_record.password_hash) <> user_record.password_hash THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid credentials');
    END IF;

    -- Si las credenciales son correctas, se construye el objeto JSON de respuesta.
    login_data := jsonb_build_object(
        'success', true,
        'user_id', user_record.id,
        'email', p_email,
        'role', user_record.role_name,
        'tenant_id', user_record.tenant_id,
        'branch_id', user_record.branch_id,
        'first_name', user_record.first_name,
        'last_name', user_record.last_name,
        'avatar_url', user_record.avatar_url,
        'tenant_name', user_record.tenant_name
    );

    RETURN login_data;
END;
$$;
