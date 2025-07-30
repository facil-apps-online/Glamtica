-- supabase/migrations/20250729000025_create_rpc_get_investors.sql
CREATE OR REPLACE FUNCTION public.get_investors()
RETURNS TABLE(
    user_id uuid,
    email text,
    full_name text,
    avatar_url text,
    platform_id uuid,
    platform_name text,
    stake_percentage numeric
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
        p.id as platform_id,
        p.name as platform_name,
        ips.investment_share * 100 as stake_percentage
    FROM
        public.investor_platform_shares ips
    JOIN
        auth.users u ON ips.user_id = u.id
    JOIN
        public.platforms p ON ips.platform_id = p.id
    ORDER BY
        u.email, p.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_investors() TO authenticated;
COMMENT ON FUNCTION public.get_investors() IS 'Retrieves all users with the investor role and their platform stakes.';
