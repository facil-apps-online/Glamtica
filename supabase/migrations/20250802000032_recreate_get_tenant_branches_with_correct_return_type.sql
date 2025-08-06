-- 1. Drop the existing function to allow for recreating it with a different return type.
DROP FUNCTION IF EXISTS public.get_tenant_branches(uuid);

-- 2. Recreate the get_tenant_branches function with the correct return type for the name column (text).
CREATE FUNCTION public.get_tenant_branches(p_tenant_id uuid)
RETURNS TABLE(id uuid, name text)
LANGUAGE 'plpgsql'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name
  FROM
    public.branches AS b
  WHERE
    b.tenant_id = p_tenant_id
  ORDER BY
    b.name;
END;
$$;
