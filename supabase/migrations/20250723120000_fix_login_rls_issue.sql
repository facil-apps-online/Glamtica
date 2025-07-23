-- Migración final para corregir el problema de inicio de sesión.
-- Añade SECURITY DEFINER a la función login_user.
-- Esto permite que la función se ejecute con los privilegios del creador,
-- permitiéndole saltar la política de Row-Level Security (RLS) que impedía
-- a los usuarios anónimos leer la tabla 'users' para verificar sus credenciales.

DROP FUNCTION IF EXISTS public.login_user(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.login_user(
    p_email TEXT,
    p_password TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- <--- ESTA ES LA LÍNEA CLAVE DE LA SOLUCIÓN
AS $$
DECLARE
    user_record RECORD;
    login_data jsonb;
BEGIN
    -- La consulta ahora podrá ver todas las filas de 'users' gracias a SECURITY DEFINER.
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

    -- Lógica de verificación estable.
    IF user_record.id IS NULL OR user_record.password_hash IS NULL OR crypt(p_password, user_record.password_hash) <> user_record.password_hash THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid credentials');
    END IF;

    -- Construcción de la respuesta.
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
