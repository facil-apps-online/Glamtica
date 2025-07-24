-- MIGRATION: Force RLS on branches to ensure tenant data isolation

-- Step 1: Force Row Level Security to apply to all roles, including the table owner.
-- This is the critical step to ensure data is not leaked.
ALTER TABLE public.branches FORCE ROW LEVEL SECURITY;

-- Step 2: Re-create the policy with the correct syntax to ensure it is correctly applied.
-- This makes the migration script idempotent and safe to re-run.
DROP POLICY IF EXISTS "Allow tenant members to read their own branches" ON public.branches;

CREATE POLICY "Allow tenant members to read their own branches"
ON public.branches
FOR SELECT
USING (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
);

COMMENT ON POLICY "Allow tenant members to read their own branches" ON public.branches
IS 'Ensures users can only see branches associated with their own tenant.';
