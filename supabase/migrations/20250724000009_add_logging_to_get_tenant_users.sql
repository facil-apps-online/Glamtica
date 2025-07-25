-- Añade logs (RAISE NOTICE) a la función get_tenant_users para depurar su ejecución.

CREATE OR REPLACE FUNCTION public.get_tenant_users(
  target_tenant_id uuid,
  p_user_role TEXT -- Parámetro mantenido por compatibilidad, pero la lógica interna usa auth.uid()
)
RETURNS TABLE (
  id uuid,
  email text,
  role_name text,
  is_active boolean,
  created_at timestamptz,
  tenant_id uuid
)
LANGUAGE plpgsql
AS $$
DECLARE
  requesting_user_id uuid := auth.uid();
  is_super_admin boolean;
  caller_role_in_tenant text;
BEGIN
  RAISE NOTICE '[get_tenant_users] START: target_tenant_id=%, p_user_role=%, requesting_user_id=%', target_tenant_id, p_user_role, requesting_user_id;

  -- Primero, verificar si el usuario es un super_admin global
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.id = requesting_user_id AND r.name = 'super_admin'
  ) INTO is_super_admin;
  RAISE NOTICE '[get_tenant_users] CHECK 1: is_super_admin=%', is_super_admin;

  -- Si no es super_admin, obtener su rol específico para el tenant solicitado
  IF NOT is_super_admin THEN
    SELECT r.name INTO caller_role_in_tenant
    FROM public.user_assignments ua
    JOIN public.roles r ON ua.role_id = r.id
    WHERE ua.user_id = requesting_user_id AND ua.tenant_id = target_tenant_id;
    RAISE NOTICE '[get_tenant_users] CHECK 2: caller_role_in_tenant=%', caller_role_in_tenant;
  END IF;

  -- Comprobar permisos: denegar si no es super_admin Y su rol es 'tenant_user' o no tiene rol en el tenant
  IF NOT is_super_admin AND (caller_role_in_tenant IS NULL OR caller_role_in_tenant = 'tenant_user') THEN
    RAISE NOTICE '[get_tenant_users] PERMISSION DENIED: User is not super_admin and their role is %', caller_role_in_tenant;
    RAISE EXCEPTION 'Access denied. User does not have sufficient privileges for this tenant.';
  END IF;

  RAISE NOTICE '[get_tenant_users] PERMISSION GRANTED. Executing final query...';
  -- Si los permisos son correctos, ejecutar la consulta
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    r.name as role_name,
    u.is_active,
    u.created_at,
    ua.tenant_id
  FROM
    public.users u
  JOIN
    public.user_assignments ua ON u.id = ua.user_id
  JOIN
    public.roles r ON ua.role_id = r.id
  WHERE
    ua.tenant_id = target_tenant_id;
END;
$$;

-- Se mantienen los permisos para cualquier usuario autenticado, la lógica interna se encarga de la autorización.
GRANT EXECUTE ON FUNCTION public.get_tenant_users(uuid, text) TO authenticated;
