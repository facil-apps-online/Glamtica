-- MIGRATION: Enable RLS and define select policy for branches (Corrected)

-- 1. Enable Row Level Security on the branches table
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- 2. Drop the old policy if it exists to avoid errors on re-run
DROP POLICY IF EXISTS "Allow tenant members to read their own branches" ON public.branches;

-- 3. Create a policy to allow users to see only branches belonging to their tenant
CREATE POLICY "Allow tenant members to read their own branches"
ON public.branches
FOR SELECT
USING (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
);

-- Note: Policies for INSERT, UPDATE, DELETE should also be created
-- to ensure full security, but for the current query issue, SELECT is the priority.
-- We assume these might exist or will be added later.