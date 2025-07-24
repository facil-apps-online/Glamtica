-- MIGRATION: Optimize and enhance get_tenant_branches function (Corrected)

-- Step 1: Create an index on the tenant_id column for performance
CREATE INDEX IF NOT EXISTS idx_branches_tenant_id ON public.branches(tenant_id);

-- Step 2: Drop the old function because its return type is changing
DROP FUNCTION IF EXISTS public.get_tenant_branches(UUID);

-- Step 3: Create the new version of the function to return all branch fields
CREATE OR REPLACE FUNCTION public.get_tenant_branches(
    p_tenant_id UUID
)
RETURNS SETOF public.branches -- Return the full branch type
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- This function is now optimized by the index on tenant_id
  SELECT *
  FROM public.branches
  WHERE tenant_id = p_tenant_id
  ORDER BY is_main_branch DESC, name ASC; -- Show main branch first, then sort by name
$$;

-- Re-grant permissions to the new function
GRANT EXECUTE ON FUNCTION public.get_tenant_branches(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_tenant_branches(UUID) IS 'Returns all branches for a given tenant, optimized with an index.';