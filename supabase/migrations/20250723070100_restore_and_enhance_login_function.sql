-- Migración para restaurar la función login_user a un estado funcional y seguro,
-- añadiendo el tenant_name como se validó.

DROP FUNCTION IF EXISTS public.login_user(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.login_user(
    p_email TEXT,
    p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Consulta única y robusta que obtiene todos los datos necesarios.
    -- Esta estructura fue validada como funcional.
    SELECT
        u.id,
        u.password_hash,
        u.tenant_id,
        u.branch_id,
        r.name AS role_name,
        u.first_name,
        u.last_name,
        u.avatar_url,
        t.name AS tenant_name
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

    -- Verificación de credenciales. Si la consulta no encontró al usuario, user_record.id será NULL.
    IF user_record.id IS NULL OR user_record.password_hash IS NULL OR public.crypt(p_password, user_record.password_hash) <> user_record.password_hash THEN
        RETURN json_build_object('success', FALSE, 'message', 'Invalid credentials');
    END IF;

    -- Devolver el resultado completo, incluyendo el tenant_name (que será NULL para el super_admin).
    RETURN json_build_object(
        'success', TRUE,
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
END;
$$;
