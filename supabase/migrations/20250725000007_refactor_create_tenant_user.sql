-- Migration: 20250725000007_refactor_create_tenant_user.sql
-- Description: Refactors the create_tenant_user RPC to use the native Supabase Auth system.

-- Step 1: Drop the old function that depended on the now-deleted custom auth tables.
DROP FUNCTION IF EXISTS public.create_tenant_user(TEXT, TEXT, UUID, UUID, UUID);

-- Step 2: Create the new, refactored create_tenant_user function.
CREATE OR REPLACE FUNCTION public.create_tenant_user(
    p_email TEXT,
    p_role_id UUID,
    p_tenant_id UUID,
    p_branch_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_caller_role TEXT := (auth.jwt() -> 'app_metadata' ->> 'role');
    v_caller_tenant_id UUID := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
    v_new_user_id UUID;
BEGIN
    -- Step 2a: Authorization Check
    IF v_caller_role NOT IN ('super_admin', 'tenant_super_admin', 'tenant_admin') THEN
        RAISE EXCEPTION 'Permission denied: You do not have rights to create users.';
    END IF;

    IF v_caller_role != 'super_admin' AND v_caller_tenant_id != p_tenant_id THEN
        RAISE EXCEPTION 'Permission denied: You can only create users within your own tenant.';
    END IF;

    -- Step 2b: Create the user in Supabase Auth via invitation
    SELECT auth.admin_create_user(p_email) INTO v_new_user_id;

    -- Step 2c: Assign role and tenancy using our helper function
    PERFORM public.set_user_assignment(
        p_target_user_id := v_new_user_id,
        p_tenant_id := p_tenant_id,
        p_role_id := p_role_id,
        p_branch_id := p_branch_id
    );

    -- Step 2d: Return a success message
    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'User invited successfully.',
        'user_id', v_new_user_id
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- COMMENT: Refactors the create_tenant_user RPC to be compatible with the native Supabase Auth system, creating users via invitation and assigning roles via app_metadata.
