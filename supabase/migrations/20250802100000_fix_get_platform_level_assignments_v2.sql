CREATE OR REPLACE FUNCTION public.get_platform_level_assignments()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_agg(t.user_data)
    INTO result
    FROM (
        SELECT
            u.id as user_id,
            u.raw_user_meta_data->>'full_name' as full_name,
            u.email,
            jsonb_build_object(
                'app_super_admin', (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'platform_id', a->>'platform_id', -- <-- CORRECCIÓN CLAVE
                            'platform_name', p.name
                        )
                    )
                    FROM jsonb_array_elements(u.raw_app_meta_data->'assignments') as a
                    JOIN platforms p ON p.id = (a->>'platform_id')::uuid
                    WHERE a->>'role' = 'app_super_admin'
                ),
                'investor', (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'platform_id', s.platform_id, -- <-- CORRECCIÓN CLAVE
                            'platform_name', p.name,
                            'stake_percentage', s.investment_share * 100
                        )
                    )
                    FROM investor_platform_shares s
                    JOIN platforms p ON p.id = s.platform_id
                    WHERE s.user_id = u.id
                )
            ) as platform_roles
        FROM auth.users u
        WHERE
            (u.raw_app_meta_data->'assignments' IS NOT NULL AND jsonb_array_length(u.raw_app_meta_data->'assignments') > 0) OR
            (u.id IN (SELECT user_id FROM investor_platform_shares))
    ) t;

    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

COMMENT ON FUNCTION public.get_platform_level_assignments() IS 'V2: Fetches users with special platform-level roles (investor, app_super_admin), ensuring platform_id is included for management actions.';