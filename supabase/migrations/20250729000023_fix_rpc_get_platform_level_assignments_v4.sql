-- supabase/migrations/20250729000023_fix_rpc_get_platform_level_assignments_v4.sql
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
    SELECT
        u.id as user_id,
        u.email,
        u.raw_user_meta_data->>'full_name' as full_name,
        u.raw_user_meta_data->>'avatar_url' as avatar_url,
        jsonb_build_object(
            'app_super_admin', COALESCE(
                (
                    SELECT jsonb_agg(DISTINCT p.name)
                    FROM jsonb_array_elements(u.raw_app_meta_data->'assignments') AS asgn
                    JOIN public.platforms p ON (asgn->>'platform_id')::uuid = p.id
                    WHERE asgn->>'role' = 'app_super_admin' AND asgn->>'platform_id' IS NOT NULL
                ),
                '[]'::jsonb
            ),
            'investor', COALESCE(
                (
                    SELECT jsonb_agg(jsonb_build_object(
                        'platform_name', p.name,
                        'stake_percentage', ips.investment_share * 100
                    ))
                    FROM public.investor_platform_shares ips
                    JOIN public.platforms p ON ips.platform_id = p.id
                    WHERE ips.user_id = u.id
                ),
                '[]'::jsonb
            )
        ) as platform_roles
    FROM
        auth.users u
    WHERE
        (u.raw_app_meta_data->'assignments' @> '[{"role":"app_super_admin"}]')
        OR
        (u.id IN (SELECT share.user_id FROM public.investor_platform_shares share));
END;
$$;

COMMENT ON FUNCTION public.get_platform_level_assignments() IS 'v5: Bulletproof version with explicit COALESCE to prevent type mismatch on empty subqueries.';
