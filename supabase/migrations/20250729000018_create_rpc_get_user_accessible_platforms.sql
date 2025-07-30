-- supabase/migrations/20250729000018_create_rpc_get_user_accessible_platforms.sql
CREATE OR REPLACE FUNCTION public.get_user_accessible_platforms()
RETURNS TABLE(platform_id uuid)
LANGUAGE sql
SECURITY DEFINER
AS $$
    -- Combina las plataformas de las asignaciones de app_super_admin
    SELECT (jsonb_array_elements(raw_app_meta_data->'assignments')->>'platform_id')::uuid
    FROM auth.users
    WHERE id = auth.uid()
      AND raw_app_meta_data->'assignments' @> '[{"role":"app_super_admin"}]'
    
    UNION
    
    -- Combina las plataformas de las participaciones de investor
    SELECT ips.platform_id
    FROM public.investor_platform_shares ips
    WHERE ips.user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_user_accessible_platforms() TO authenticated;
COMMENT ON FUNCTION public.get_user_accessible_platforms() IS 'Devuelve un array de IDs de las plataformas a las que el usuario actual tiene acceso, ya sea como app_super_admin o como investor.';
