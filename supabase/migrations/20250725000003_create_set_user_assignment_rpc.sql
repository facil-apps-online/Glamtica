-- Migration: 20250725000003_create_set_user_assignment_rpc.sql
-- Description: This migration creates the set_user_assignment RPC function.
-- This function is the new standard for assigning roles and tenancy to users
-- within the native Supabase Auth system by updating the user's app_metadata.

CREATE OR REPLACE FUNCTION public.set_user_assignment(
    p_target_user_id UUID,
    p_tenant_id UUID,
    p_role_id UUID,
    p_branch_id UUID DEFAULT NULL,
    p_status TEXT DEFAULT 'active'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_caller_role TEXT := (auth.jwt() -> 'app_metadata' ->> 'role');
    v_caller_tenant_id UUID := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
    
    v_target_role_name TEXT;
    v_new_metadata JSONB;
BEGIN
    -- Step 1: Validate that the target role exists
    SELECT name INTO v_target_role_name FROM public.roles WHERE id = p_role_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Role with ID % not found.', p_role_id;
    END IF;

    -- Step 2: Authorization Check (Who is calling this function?)
    IF v_caller_role = 'super_admin' THEN
        -- Super admin can do anything.
        NULL; 
    ELSIF v_caller_role = 'tenant_super_admin' THEN
        -- Tenant super admin can only make assignments within their own tenant.
        IF p_tenant_id != v_caller_tenant_id THEN
            RAISE EXCEPTION 'Permission denied: You can only assign users within your own tenant.';
        END IF;
        -- And they cannot create another super admin.
        IF v_target_role_name = 'super_admin' THEN
            RAISE EXCEPTION 'Permission denied: You cannot assign the super_admin role.';
        END IF;
    ELSE
        -- All other roles are denied.
        RAISE EXCEPTION 'Permission denied: You do not have rights to assign roles.';
    END IF;

    -- Step 3: Construct the new metadata object
    v_new_metadata := jsonb_build_object(
        'role', v_target_role_name,
        'tenant_id', p_tenant_id,
        'branch_id', p_branch_id,
        'assignment_status', p_status
    );

    -- Step 4: Update the user's app_metadata in the auth.users table
    UPDATE auth.users
    SET raw_app_meta_data = raw_app_meta_data || v_new_metadata
    WHERE id = p_target_user_id;

    -- Step 5: Return success
    RETURN jsonb_build_object('success', true, 'message', 'User assignment updated successfully.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.set_user_assignment(UUID, UUID, UUID, UUID, TEXT) 
IS 'Sets or updates a user''s role, tenant, and branch by modifying their app_metadata. Restricted to super_admins and tenant_super_admins.';
