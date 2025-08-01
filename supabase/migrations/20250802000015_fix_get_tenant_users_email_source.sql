-- Migration to fix the source of the user email in the get_tenant_users RPC.
-- This version changes the email source to prioritize the real email stored in raw_user_meta_data.
-- It uses COALESCE to fall back to the synthetic email if the real one is not present,
-- ensuring backward compatibility with older user records.

DROP FUNCTION IF EXISTS get_tenant_users(uuid);

CREATE OR REPLACE FUNCTION get_tenant_users(
  target_tenant_id uuid
)
RETURNS TABLE (
  assignment_id uuid,
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  role_id uuid,
  role_name text,
  role_display_name text,
  branch_id uuid,
  branch_name text,
  status text,
  raw_user_meta_data jsonb -- Se añade para poder usarlo en la selección
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (user_assignment->>'assignment_id')::uuid,
    u.id as user_id,
    COALESCE(u.raw_user_meta_data->>'email', u.email)::text as email, -- CORRECTED SOURCE
    u.raw_user_meta_data->>'first_name' as first_name,
    u.raw_user_meta_data->>'last_name' as last_name,
    (user_assignment->>'role_id')::uuid,
    r.name as role_name,
    r.display_name as role_display_name,
    (user_assignment->>'branch_id')::uuid,
    b.name as branch_name,
    user_assignment->>'status' as status,
    u.raw_user_meta_data
  FROM
    auth.users u,
    jsonb_array_elements(u.raw_app_meta_data->'assignments') as user_assignment
  LEFT JOIN
    public.roles r ON (user_assignment->>'role_id')::uuid = r.id
  LEFT JOIN
    public.branches b ON (user_assignment->>'branch_id')::uuid = b.id
  WHERE
    (user_assignment->>'tenant_id')::uuid = target_tenant_id;
END;
$$;
