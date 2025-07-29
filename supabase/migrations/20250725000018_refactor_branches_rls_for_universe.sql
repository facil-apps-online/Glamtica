-- Migration: 20250725000018_refactor_branches_rls_for_universe.sql
-- Description: Refactors the RLS policy on the branches table to support the
-- multi-assignment array structure of the "Universe" architecture.

-- Step 1: Drop the old policy.
DROP POLICY IF EXISTS "Branches Access Control" ON public.branches;

-- Step 2: Create the new, more powerful policy.
CREATE POLICY "Universe Branches Access Control" ON public.branches
FOR ALL
USING (
    -- Allow access if the user has a 'super_admin' role in any of their assignments.
    EXISTS (
        SELECT 1
        FROM jsonb_array_elements(auth.jwt() -> 'app_metadata' -> 'assignments') as elem
        WHERE elem ->> 'role' = 'super_admin'
    )
    OR
    -- Allow access if the branch's tenant_id is present in any of the user's assignments.
    EXISTS (
        SELECT 1
        FROM jsonb_array_elements(auth.jwt() -> 'app_metadata' -> 'assignments') as elem
        WHERE (elem ->> 'tenant_id')::uuid = tenant_id
    )
)
WITH CHECK (
    -- For writing (INSERT, UPDATE), allow if the user is a super_admin
    -- OR has an admin role for the specific tenant of the branch.
    EXISTS (
        SELECT 1
        FROM jsonb_array_elements(auth.jwt() -> 'app_metadata' -> 'assignments') as elem
        WHERE 
            (elem ->> 'role' = 'super_admin') OR
            (
                (elem ->> 'tenant_id')::uuid = tenant_id AND
                elem ->> 'role' IN ('tenant_super_admin', 'tenant_admin')
            )
    )
);

-- COMMENT: Refactors the RLS policy for the branches table to handle the multi-assignment array in user app_metadata.
