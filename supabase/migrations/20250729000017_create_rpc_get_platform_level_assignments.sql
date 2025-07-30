-- supabase/migrations/20250729000017_create_rpc_get_platform_level_assignments.sql
CREATE OR REPLACE FUNCTION public.get_platform_level_assignments()
RETURNS TABLE(
    user_id uuid,
    email text,
    full_name text,
    avatar_url text,
    platform_roles jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH user_platform_roles AS (
        -- Roles de 'app_super_admin' desde el app_metadata
        SELECT
            u.id AS user_id,
            'app_super_admin' AS role_name,
            jsonb_agg(DISTINCT p.name) AS platforms
        FROM
            auth.users u,
            jsonb_array_elements(u.raw_app_meta_data->'assignments') AS asgn
        JOIN
            public.platforms p ON (asgn->>'platform_id')::uuid = p.id
        WHERE
            asgn->>'role' = 'app_super_admin'
        GROUP BY
            u.id

        UNION ALL

        -- Roles de 'investor' desde la tabla de participaciones
        SELECT
            ips.user_id,
            'investor' AS role_name,
            jsonb_agg(jsonb_build_object(
                'platform_name', p.name,
                'stake_percentage', ips.investment_share * 100 -- Convertir a porcentaje
            )) AS platforms
        FROM
            public.investor_platform_shares ips
        JOIN
            public.platforms p ON ips.platform_id = p.id
        GROUP BY
            ips.user_id
    ),
    aggregated_roles AS (
        SELECT
            upr.user_id,
            jsonb_object_agg(upr.role_name, upr.platforms) AS platform_roles
        FROM
            user_platform_roles upr
        GROUP BY
            upr.user_id
    )
    SELECT
        u.id AS user_id,
        u.email,
        u.raw_user_meta_data->>'full_name' AS full_name,
        u.raw_user_meta_data->>'avatar_url' AS avatar_url,
        ar.platform_roles
    FROM
        auth.users u
    JOIN
        aggregated_roles ar ON u.id = ar.user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_level_assignments() TO authenticated;
COMMENT ON FUNCTION public.get_platform_level_assignments() IS 'Obtiene los roles a nivel de plataforma (investor, app_super_admin) para todos los usuarios que los tengan, consolidando la información de app_metadata y la tabla de participaciones.';
