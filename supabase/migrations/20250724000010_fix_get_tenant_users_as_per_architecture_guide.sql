-- Corrige la función get_tenant_users para alinearla con la guía de arquitectura.
-- 1. Elimina todas las versiones anteriores para evitar conflictos.
-- 2. La autorización se basa en el parámetro p_user_role, no en auth.uid().
-- 3. Se deniega el acceso únicamente al rol 'tenant_user'.
-- 4. La consulta usa el JOIN correcto con user_assignments.

-- Limpieza exhaustiva de versiones antiguas
DROP FUNCTION IF EXISTS public.get_tenant_users(uuid);
DROP FUNCTION IF EXISTS public.get_tenant_users(uuid, text);

-- Recreación de la función correcta
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
