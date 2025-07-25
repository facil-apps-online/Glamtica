-- Añade SECURITY DEFINER a la función get_tenant_users para permitirle eludir las políticas de RLS
-- y leer los datos necesarios. La seguridad interna de la función (basada en p_user_role) se mantiene.

-- Limpieza de la versión anterior
DROP FUNCTION IF EXISTS public.get_tenant_users(uuid, text);

-- Recreación de la función con SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_tenant_users(
  target_tenant_id uuid,
  p_user_role TEXT
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
SECURITY DEFINER
AS $$
BEGIN
  -- Comprobar permisos según la guía de arquitectura
  IF p_user_role = 'tenant_user' THEN
    RAISE EXCEPTION 'Access denied. Role tenant_user cannot perform this action.';
  END IF;

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

GRANT EXECUTE ON FUNCTION public.get_tenant_users(uuid, text) TO authenticated;
