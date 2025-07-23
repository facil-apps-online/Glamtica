-- Migración para restaurar la lógica de login funcional y añadir el tenant_name de forma segura

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
    -- Usar la estructura de consulta probada, añadiendo el LEFT JOIN y COALESCE
    SELECT
        u.id,
        u.password_hash,
        COALESCE(u.tenant_id, '00000000-0000-0000-0000-000000000000') AS tenant_id,
        u.branch_id,
        r.name AS role_name,
        u.first_name,
        u.last_name,
        u.avatar_url,
        COALESCE(t.name, 'Glamtica Control Panel') AS tenant_name
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

    -- Usar la lógica de verificación probada
    IF user_record.id IS NULL OR user_record.password_hash IS NULL OR public.crypt(p_password, user_record.password_hash) <> user_record.password_hash THEN
        RETURN json_build_object('success', FALSE, 'message', 'Invalid credentials');
    END IF;

    -- Devolver el resultado completo
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
