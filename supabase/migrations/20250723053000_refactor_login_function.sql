-- Migración para refactorizar la función login_user y hacerla más robusta

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
    full_user_data RECORD;
BEGIN
    -- Paso 1: Encontrar al usuario y verificar si existe
    SELECT id, password_hash INTO user_record
    FROM public.users
    WHERE email = p_email AND is_active = TRUE;

    -- Si no se encuentra el usuario, las credenciales son inválidas
    IF user_record.id IS NULL THEN
        RETURN json_build_object('success', FALSE, 'message', 'Invalid credentials');
    END IF;

    -- Paso 2: Verificar la contraseña
    IF user_record.password_hash IS NULL OR public.crypt(p_password, user_record.password_hash) <> user_record.password_hash THEN
        RETURN json_build_object('success', FALSE, 'message', 'Invalid credentials');
    END IF;

    -- Paso 3: Si las credenciales son correctas, obtener todos los datos del usuario
    SELECT
        u.id,
        u.tenant_id,
        u.branch_id,
        r.name AS role_name,
        u.first_name,
        u.last_name,
        u.avatar_url,
        t.name AS tenant_name
    INTO
        full_user_data
    FROM
        public.users u
    JOIN
        public.roles r ON u.role_id = r.id
    LEFT JOIN
        public.tenants t ON u.tenant_id = t.id
    WHERE
        u.id = user_record.id;

    -- Devolver todos los datos
    RETURN json_build_object(
        'success', TRUE,
        'user_id', full_user_data.id,
        'email', p_email,
        'role', full_user_data.role_name,
        'tenant_id', full_user_data.tenant_id,
        'branch_id', full_user_data.branch_id,
        'first_name', full_user_data.first_name,
        'last_name', full_user_data.last_name,
        'avatar_url', full_user_data.avatar_url,
        'tenant_name', full_user_data.tenant_name
    );
END;
$$;
