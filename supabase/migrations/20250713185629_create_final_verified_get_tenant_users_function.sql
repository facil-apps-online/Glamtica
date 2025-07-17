-- Esta migración crea la versión final y correcta de la función get_tenant_users,
-- basada en la consulta SQL que fue validada manualmente.

-- Primero, nos aseguramos de que no haya versiones antiguas.
DROP FUNCTION IF EXISTS public.get_tenant_users(uuid, text);

-- Crear la función con la lógica correcta
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
  -- Paso 1: Comprobar si el rol del usuario que llama es 'super_admin'
  IF p_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Acceso denegado. Se requiere rol de super_admin.';
  END IF;

  -- Paso 2: Ejecutar la consulta que ya ha sido probada y validada
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    r.name as role_name,
    u.is_active,
    u.created_at,
    u.tenant_id
  FROM
    public.users u
  JOIN
    public.roles r ON u.role_id = r.id
  WHERE
    u.tenant_id = target_tenant_id;
END;
$$;

-- Conceder permisos de ejecución
GRANT EXECUTE ON FUNCTION public.get_tenant_users(uuid, text) TO public;
