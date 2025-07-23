-- Migración para (1) asignar un tenant por defecto al super_admin,
-- (2) asegurar que ese tenant exista, y (3) restaurar la función de login a un estado estable.

-- Paso 1: Asegurar que el tenant para el panel de control exista.
-- Se usa ON CONFLICT para que la migración no falle si ya fue insertado.
INSERT INTO public.tenants (id, name, is_active)
VALUES ('00000000-0000-0000-0000-000000000000', 'Glamtica Control Panel', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Paso 2: Asignar el tenant del panel de control a todos los super_admins que no tengan uno.
-- Esto corrige los datos en la fuente para evitar lógica condicional en el código.
-- Esta operación es ahora posible gracias a la migración anterior que modifica el trigger.
UPDATE public.users
SET tenant_id = '00000000-0000-0000-0000-000000000000'
WHERE
    role_id = (SELECT id FROM public.roles WHERE name = 'super_admin' LIMIT 1)
    AND tenant_id IS NULL;

-- Paso 3: Recrear la función de login para que sea estable y lea los datos corregidos.
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
    -- La consulta ahora encontrará directamente el tenant_name para el super_admin gracias a la corrección de datos.
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
