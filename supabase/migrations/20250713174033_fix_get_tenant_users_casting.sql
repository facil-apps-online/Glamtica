-- Helper function to check if a string is a valid UUID
CREATE OR REPLACE FUNCTION is_valid_uuid(s text) RETURNS boolean AS $$
BEGIN
  RETURN s ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
EXCEPTION WHEN others THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Re-create the main function with the robust check
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
  -- Role check remains the same
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
  WHERE
    -- Check that the metadata field exists and is not null
    u.raw_user_meta_data ->> 'tenant_id' IS NOT NULL AND
    -- Check that the field is a valid UUID before casting
    is_valid_uuid(u.raw_user_meta_data ->> 'tenant_id') AND
    -- Finally, perform the cast and comparison
    (u.raw_user_meta_data ->> 'tenant_id')::uuid = target_tenant_id;
END;
$$;
