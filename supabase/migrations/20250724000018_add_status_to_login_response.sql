-- Corrige la función de login para que incluya el campo 'status' en cada una de las
-- asignaciones que devuelve al frontend.

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
    user_assignments jsonb;
    has_active_assignment BOOLEAN;
BEGIN
    -- 1. Verificar credenciales del usuario
    SELECT
        u.id,
        u.password_hash,
        u.first_name,
        u.last_name,
        u.avatar_url,
        u.country_id,
        u.language_id,
        u.currency_id,
        u.timezone_id
    INTO
        user_record
    FROM
        public.users u
    WHERE
        u.email = p_email;

    IF user_record.id IS NULL OR user_record.password_hash IS NULL OR crypt(p_password, user_record.password_hash) <> user_record.password_hash THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid credentials');
    END IF;

    -- 2. Verificar si el usuario tiene al menos una asignación activa
    SELECT EXISTS (
        SELECT 1
        FROM public.user_assignments ua
        WHERE ua.user_id = user_record.id AND ua.status = 'active'
    ) INTO has_active_assignment;

    IF NOT has_active_assignment THEN
        RETURN jsonb_build_object('success', false, 'message', 'User does not have any active assignments.');
    END IF;

    -- 3. Obtener todas las asignaciones, AHORA INCLUYENDO EL STATUS
    SELECT jsonb_agg(
        jsonb_build_object(
            'assignment_id', ua.id,
            'tenant_id', ua.tenant_id,
            'tenant_name', t.name,
            'role_id', ua.role_id,
            'role_name', r.name,
            'branch_id', ua.branch_id,
            'branch_name', b.name,
            'status', ua.status -- CAMPO AÑADIDO
        )
    )
    INTO user_assignments
    FROM public.user_assignments ua
    JOIN public.roles r ON ua.role_id = r.id
    JOIN public.tenants t ON ua.tenant_id = t.id
    LEFT JOIN public.branches b ON ua.branch_id = b.id
    WHERE ua.user_id = user_record.id;

    -- 4. Construir la respuesta final
    RETURN jsonb_build_object(
        'success', true,
        'profile', jsonb_build_object(
            'id', user_record.id,
            'email', p_email,
            'first_name', user_record.first_name,
            'last_name', user_record.last_name,
            'avatar_url', user_record.avatar_url,
            'country_id', user_record.country_id,
            'language_id', user_record.language_id,
            'currency_id', user_record.currency_id,
            'timezone_id', user_record.timezone_id
        ),
        'assignments', COALESCE(user_assignments, '[]'::jsonb)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.login_user(TEXT, TEXT) TO public;
