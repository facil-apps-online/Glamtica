-- Migration: 20250725000009_refactor_user_assignments_rpc.sql
-- Description: Refactors the get_user_assignments and update_user_assignments RPCs
-- to use the native Supabase Auth system.

-- Step 1: Drop the old functions.
DROP FUNCTION IF EXISTS public.get_user_assignments(uuid, uuid);
DROP FUNCTION IF EXISTS public.update_user_assignments(uuid, uuid, jsonb, text);

-- Step 2: Create the new, refactored get_user_assignments function.
CREATE OR REPLACE FUNCTION public.get_user_assignments(
    p_user_id UUID,
    p_tenant_id UUID
)
RETURNS TABLE (
    assignment_id UUID,
    user_id UUID,
    tenant_id UUID,
    role_id UUID,
    branch_id UUID,
    status TEXT,
    role_name TEXT,
    role_display_name TEXT,
    branch_name TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_caller_role TEXT := (auth.jwt() -> 'app_metadata' ->> 'role');
    v_caller_tenant_id UUID := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
BEGIN
    -- Authorization Check
    IF v_caller_role NOT IN ('super_admin', 'tenant_super_admin', 'tenant_admin') THEN
        RAISE EXCEPTION 'Access denied.';
    END IF;

    IF v_caller_role != 'super_admin' AND v_caller_tenant_id != p_tenant_id THEN
        RAISE EXCEPTION 'Access denied: You can only view assignments within your own tenant.';
    END IF;

    -- Query from auth.users and app_metadata
    RETURN QUERY
    SELECT
        (u.raw_app_meta_data ->> 'assignment_id')::uuid,
        u.id,
        (u.raw_app_meta_data ->> 'tenant_id')::uuid,
        r.id,
        (u.raw_app_meta_data ->> 'branch_id')::uuid,
        (u.raw_app_meta_data ->> 'assignment_status'),
        r.name,
        r.display_name,
        b.name
    FROM
        auth.users u
    LEFT JOIN
        public.roles r ON (u.raw_app_meta_data ->> 'role') = r.name
    LEFT JOIN
        public.branches b ON (u.raw_app_meta_data ->> 'branch_id')::uuid = b.id
    WHERE
        u.id = p_user_id
        AND (u.raw_app_meta_data ->> 'tenant_id')::uuid = p_tenant_id;
END;
$$;

-- Step 3: Create the new, refactored update_user_assignments function.
CREATE OR REPLACE FUNCTION public.update_user_assignments(
    p_user_id UUID,
    p_tenant_id UUID,
    p_assignments JSONB -- Expects an array, but we'll use the first object
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_caller_role TEXT := (auth.jwt() -> 'app_metadata' ->> 'role');
    v_caller_tenant_id UUID := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
    v_assignment JSONB;
    v_role_id UUID;
    v_branch_id UUID;
    v_status TEXT;
BEGIN
    -- Authorization Check
    IF v_caller_role NOT IN ('super_admin', 'tenant_super_admin', 'tenant_admin') THEN
        RAISE EXCEPTION 'Permission denied.';
    END IF;

    IF v_caller_role != 'super_admin' AND v_caller_tenant_id != p_tenant_id THEN
        RAISE EXCEPTION 'Permission denied: You can only update assignments within your own tenant.';
    END IF;

    -- Extract the single assignment from the JSON array
    v_assignment := p_assignments -> 0;
    IF v_assignment IS NULL THEN
        RAISE EXCEPTION 'No assignment data provided.';
    END IF;

    v_role_id := (v_assignment ->> 'role_id')::uuid;
    v_branch_id := (v_assignment ->> 'branch_id')::uuid;
    v_status := v_assignment ->> 'status';

    -- Use our helper function to update the user's metadata
    PERFORM public.set_user_assignment(
        p_target_user_id := p_user_id,
        p_tenant_id := p_tenant_id,
        p_role_id := v_role_id,
        p_branch_id := v_branch_id,
        p_status := v_status
    );

    RETURN jsonb_build_object('success', true, 'message', 'User assignment updated successfully.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- COMMENT: Refactors get_user_assignments and update_user_assignments RPCs to use the native Supabase Auth system.
