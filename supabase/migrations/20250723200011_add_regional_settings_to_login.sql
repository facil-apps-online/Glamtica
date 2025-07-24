-- Migración para añadir la configuración regional del usuario a la respuesta de la función de login.

DROP FUNCTION IF EXISTS public.login_user(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.login_user(
    p_email TEXT,
    p_password TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_profile RECORD;
    user_assignments_json JSONB;
BEGIN
    -- Verificar credenciales y obtener perfil del usuario, incluyendo configuración regional.
    SELECT 
        u.id, 
        u.email, 
        u.first_name, 
        u.last_name, 
        u.avatar_url,
        u.country_id,
        u.language_id,
        u.currency_id,
        u.timezone_id
    INTO user_profile
    FROM public.users u
    WHERE u.email = p_email AND u.password_hash = crypt(p_password, u.password_hash) AND u.is_active = TRUE;

    -- Si no se encuentra el usuario, las credenciales son inválidas.
    IF user_profile.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid credentials');
    END IF;

    -- Obtener todas las asignaciones del usuario y convertirlas a un array JSON.
    SELECT jsonb_agg(assignments)
    INTO user_assignments_json
    FROM (
        SELECT
            ua.id as assignment_id,
            ua.tenant_id,
            t.name as tenant_name,
            ua.role_id,
            r.name as role_name,
            ua.branch_id,
            b.name as branch_name
        FROM public.user_assignments ua
        JOIN public.roles r ON ua.role_id = r.id
        JOIN public.tenants t ON ua.tenant_id = t.id
        LEFT JOIN public.branches b ON ua.branch_id = b.id
        WHERE ua.user_id = user_profile.id
    ) as assignments;

    -- Devolver el objeto de respuesta final.
    RETURN jsonb_build_object(
        'success', true,
        'profile', to_jsonb(user_profile),
        'assignments', COALESCE(user_assignments_json, '[]'::jsonb)
    );
END;
$$;
