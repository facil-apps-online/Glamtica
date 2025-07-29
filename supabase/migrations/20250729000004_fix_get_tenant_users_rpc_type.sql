-- Migration to fix the data type mismatch in the get_tenant_users RPC function.
-- The `email` column in `public.users` is character varying(255), but the function
-- was expecting `text`, causing a structure mismatch error.
-- This migration casts the email column to text to match the function's return type.

DROP FUNCTION IF EXISTS get_tenant_users(uuid, text);

CREATE OR REPLACE FUNCTION get_tenant_users(
  target_tenant_id uuid,
  p_user_role TEXT
)
RETURNS TABLE (
  id uuid,
  email text,
  role_name text,
  is_active boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Security check remains the same
  IF p_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Acceso denegado. Se requiere rol de super_admin.';
  END IF;

  -- The query now correctly casts the email column to text
  RETURN QUERY
  SELECT
    u.id,
    u.email::text, -- Explicitly cast to TEXT
    r.name as role_name,
    u.is_active,
    u.created_at
  FROM
    public.users u
  JOIN
    public.roles r ON u.role_id = r.id
  WHERE
    u.tenant_id = target_tenant_id;
END;
$$;
