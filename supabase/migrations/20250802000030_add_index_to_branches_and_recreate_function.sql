-- 1. Add an index to the tenant_id column on the branches table to improve query performance.
CREATE INDEX IF NOT EXISTS idx_branches_tenant_id ON public.branches(tenant_id);

-- 2. Recreate the get_tenant_branches function to be called by the tenant-actions edge function.
-- This function retrieves all branches for a specific tenant without performing role checks,
-- as security is handled by the calling edge function.
CREATE OR REPLACE FUNCTION public.get_tenant_branches(p_tenant_id uuid)
RETURNS TABLE(id uuid, name character varying)
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
