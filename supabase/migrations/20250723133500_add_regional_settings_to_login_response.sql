-- Migración para añadir los campos de configuración regional a la respuesta de la función de login.
-- Basado en el análisis del código, se confirma que el frontend ahora espera estos campos
-- en el momento del login para poblar el AuthContext. Esta migración alinea el backend
-- con este nuevo requisito del frontend y soluciona el problema de la carga de datos
-- en la página de perfil.

DROP FUNCTION IF EXISTS public.login_user(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.login_user(
    p_email TEXT,
    p_password TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Se mantiene la corrección de RLS
AS $$
DECLARE
    user_record RECORD;
    login_data jsonb;
BEGIN
    -- Se añaden los campos de configuración regional a la consulta.
    SELECT
        u.id,
        u.password_hash,
        u.tenant_id,
        u.branch_id,
        r.name as role_name,
        u.first_name,
        u.last_name,
        u.avatar_url,
        t.name as tenant_name,
        u.country_id,
        u.language_id,
        u.currency_id,
        u.timezone_id
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

    -- Se añaden los campos regionales al objeto JSON de respuesta.
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
        'tenant_name', user_record.tenant_name,
        'country_id', user_record.country_id,
        'language_id', user_record.language_id,
        'currency_id', user_record.currency_id,
        'timezone_id', user_record.timezone_id
    );

    RETURN login_data;
END;
$$;
