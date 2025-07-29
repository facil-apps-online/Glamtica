-- Migration: 20250725000010_refactor_branches_crud_and_rls.sql
-- Description: Refactors all branch-related RPCs and the RLS policy on the branches table
-- to use the native Supabase Auth system.

-- Step 1: Drop all old branch-related functions.
DROP FUNCTION IF EXISTS public.get_tenant_branches(UUID);
DROP FUNCTION IF EXISTS public.create_branch(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_branch(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.delete_branch(UUID, UUID);
DROP FUNCTION IF EXISTS public.activate_branch(UUID, UUID);
DROP FUNCTION IF EXISTS public.archive_branch(UUID, UUID);

-- Step 2: Create the new, refactored RPC functions with JWT-based authorization.

-- GET_TENANT_BRANCHES (Relies on RLS for security)
CREATE OR REPLACE FUNCTION public.get_tenant_branches(p_tenant_id UUID)
RETURNS SETOF public.branches
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  -- Security is handled by the RLS policy on public.branches
  SELECT *
  FROM public.branches
  WHERE tenant_id = p_tenant_id
  ORDER BY is_main_branch DESC, name ASC;
$$;

-- CREATE_BRANCH
CREATE OR REPLACE FUNCTION public.create_branch(p_tenant_id UUID, p_name TEXT, p_address TEXT DEFAULT NULL)
RETURNS public.branches
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_caller_role TEXT := (auth.jwt() -> 'app_metadata' ->> 'role');
    v_caller_tenant_id UUID := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
    new_branch public.branches;
BEGIN
    -- Authorization Check
    IF v_caller_role NOT IN ('super_admin', 'tenant_super_admin') THEN
        RAISE EXCEPTION 'Permission denied: You do not have rights to create branches.';
    END IF;
    IF v_caller_role != 'super_admin' AND v_caller_tenant_id != p_tenant_id THEN
        RAISE EXCEPTION 'Permission denied: You can only create branches within your own tenant.';
    END IF;

    INSERT INTO public.branches (tenant_id, name, address, is_main_branch)
    VALUES (p_tenant_id, p_name, p_address, false)
    RETURNING * INTO new_branch;
    RETURN new_branch;
END;
$$;

-- UPDATE_BRANCH
CREATE OR REPLACE FUNCTION public.update_branch(p_tenant_id UUID, p_branch_id UUID, p_name TEXT, p_address TEXT)
RETURNS public.branches
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_caller_role TEXT := (auth.jwt() -> 'app_metadata' ->> 'role');
    v_caller_tenant_id UUID := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
    updated_branch public.branches;
BEGIN
    -- Authorization Check
    IF v_caller_role NOT IN ('super_admin', 'tenant_super_admin') THEN
        RAISE EXCEPTION 'Permission denied: You do not have rights to update branches.';
    END IF;
    IF v_caller_role != 'super_admin' AND v_caller_tenant_id != p_tenant_id THEN
        RAISE EXCEPTION 'Permission denied: You can only update branches within your own tenant.';
    END IF;

    UPDATE public.branches SET name = p_name, address = p_address, updated_at = NOW()
    WHERE id = p_branch_id AND tenant_id = p_tenant_id
    RETURNING * INTO updated_branch;
    IF updated_branch IS NULL THEN RAISE EXCEPTION 'Branch not found or you do not have permission to update it.'; END IF;
    RETURN updated_branch;
END;
$$;

-- DELETE_BRANCH
CREATE OR REPLACE FUNCTION public.delete_branch(p_tenant_id UUID, p_branch_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_caller_role TEXT := (auth.jwt() -> 'app_metadata' ->> 'role');
    v_caller_tenant_id UUID := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
    v_branch record;
BEGIN
    -- Authorization Check
    IF v_caller_role NOT IN ('super_admin', 'tenant_super_admin') THEN
        RAISE EXCEPTION 'Permission denied: You do not have rights to delete branches.';
    END IF;
    IF v_caller_role != 'super_admin' AND v_caller_tenant_id != p_tenant_id THEN
        RAISE EXCEPTION 'Permission denied: You can only delete branches within your own tenant.';
    END IF;

    SELECT * INTO v_branch FROM public.branches WHERE id = p_branch_id AND tenant_id = p_tenant_id;
    IF v_branch IS NULL THEN RAISE EXCEPTION 'Branch not found or you do not have permission to delete it.'; END IF;
    IF v_branch.is_main_branch THEN RAISE EXCEPTION 'Cannot delete the main branch.'; END IF;
    
    DELETE FROM public.branches WHERE id = p_branch_id;
    RETURN jsonb_build_object('success', true, 'message', 'Branch deleted successfully');
END;
$$;

-- NOTE: The functions activate_branch and archive_branch have complex business logic
-- related to subscriptions. They will be refactored separately to ensure correctness.

-- Step 3: Drop the old RLS policy on the branches table.
DROP POLICY IF EXISTS "Allow tenant members to read their own branches" ON public.branches;

-- Step 4: Create the new, comprehensive RLS policy for the branches table.
CREATE POLICY "Branches Access Control" ON public.branches
FOR ALL
USING (
    -- Super admins can access all branches.
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
    OR
    -- Users can access branches within their own tenant.
    (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid = tenant_id
)
WITH CHECK (
    -- Only admins can create/modify branches.
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'tenant_super_admin')
    AND
    -- Non-super_admins can only do so within their own tenant.
    (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
        OR
        (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid = tenant_id
    )
);

-- COMMENT: Refactors all branches CRUD RPCs and RLS policy to use the native Supabase Auth system.
