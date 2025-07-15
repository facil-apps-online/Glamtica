-- supabase/migrations/xxxxxxxx_create_rpc_get_tenant_users.sql

CREATE OR REPLACE FUNCTION get_tenant_users(target_tenant_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  banned_until timestamptz,
  user_metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Primero, verificar que el usuario que llama es un super_admin
  IF (auth.jwt() ->> 'role') != 'super_admin' THEN
    RAISE EXCEPTION 'Acceso denegado. Se requiere rol de super_admin.';
  END IF;

  -- Si la verificación es exitosa, devolver los usuarios del tenant especificado
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
