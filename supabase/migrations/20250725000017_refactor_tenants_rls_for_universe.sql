-- Migration: 20250725000017_refactor_tenants_rls_for_universe.sql
-- Description: Refactors the RLS policy on the tenants table to support the
-- multi-assignment array structure of the "Universe" architecture.

-- Step 1: Drop the old policy.
DROP POLICY IF EXISTS "Tenant Access Control" ON public.tenants;

-- Step 2: Create the new, more powerful policy.
CREATE POLICY "Universe Tenant Access Control" ON public.tenants
FOR ALL
USING (
    -- Allow access if the user has a 'super_admin' role in any of their assignments.
    EXISTS (
        SELECT 1
        FROM jsonb_array_elements(auth.jwt() -> 'app_metadata' -> 'assignments') as elem
        WHERE elem ->> 'role' = 'super_admin'
    )
    OR
    -- Allow access if the tenant's ID is present in any of the user's assignments.
    EXISTS (
        SELECT 1
        FROM jsonb_array_elements(auth.jwt() -> 'app_metadata' -> 'assignments') as elem
        WHERE (elem ->> 'tenant_id')::uuid = id
    )
)
WITH CHECK (
    -- For writing (INSERT, UPDATE), the user MUST be a super_admin.
    EXISTS (
        SELECT 1
        FROM jsonb_array_elements(auth.jwt() -> 'app_metadata' -> 'assignments') as elem
        WHERE elem ->> 'role' = 'super_admin'
    )
);

-- COMMENT: Refactors the RLS policy for the tenants table to handle the multi-assignment array in user app_metadata.
