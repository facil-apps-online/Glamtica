-- supabase/migrations/xxxxxxxx_fix_get_tenant_users_auth_check.sql

-- Re-creamos la función con la lógica de autorización correcta
CREATE OR REPLACE FUNCTION get_tenant_users(target_tenant_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  banned_until timestamptz,
  user_metadata jsonb
)
LANGUAGE plpgsql
-- SECURITY DEFINER no es estrictamente necesario aquí si la política de RLS es suficiente,
-- pero lo mantenemos por si se necesita acceder a tablas protegidas en el futuro.
SECURITY DEFINER
AS $$
BEGIN
  -- La verificación de rol se delega a la política de seguridad (RLS)
  -- que se aplicará sobre esta función. La lógica aquí puede ser más simple.
  -- Sin embargo, mantener una comprobación explícita es una buena capa de defensa.
  IF (auth.jwt() ->> 'role') != 'super_admin' THEN
    RAISE EXCEPTION 'Acceso denegado. Se requiere rol de super_admin.';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.created_at,
    u.banned_until,
    u.raw_user_meta_data AS user_metadata
  FROM auth.users u
  WHERE (u.raw_user_meta_data ->> 'tenant_id')::uuid = target_tenant_id;
END;
$$;

-- Política de Seguridad para la función
-- Esto es redundante si ya tenemos el check dentro, pero es la forma "correcta"
-- de restringir el acceso a nivel de base de datos.
-- DROP POLICY IF EXISTS "Allow super_admin to get tenant users" ON ???; -- No se puede aplicar a funciones
-- La seguridad en la función es suficiente.
