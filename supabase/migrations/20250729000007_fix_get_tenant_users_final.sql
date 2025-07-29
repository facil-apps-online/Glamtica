-- Migration to fix and finalize the get_tenant_users RPC function.
-- This version correctly queries auth.users, unnests the assignments from metadata,
-- joins with roles and branches to get display names, and casts the email to text.
-- This provides the UI with all the necessary information in a single call.

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
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (user_assignment->>'assignment_id')::uuid,
    u.id as user_id,
    u.email::text,
    u.raw_app_meta_data->>'first_name' as first_name,
    u.raw_app_meta_data->>'last_name' as last_name,
    (user_assignment->>'role_id')::uuid,
    r.name as role_name,
    r.display_name as role_display_name,
    (user_assignment->>'branch_id')::uuid,
    b.name as branch_name,
    user_assignment->>'status' as status
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
