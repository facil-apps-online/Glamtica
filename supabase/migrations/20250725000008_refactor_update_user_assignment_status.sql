-- Migration: 20250725000008_refactor_update_user_assignment_status.sql
-- Description: Refactors the update_user_assignment_status RPC to use the native Supabase Auth system.

-- Step 1: Drop the old function that depended on the now-deleted custom auth tables.
DROP FUNCTION IF EXISTS public.update_user_assignment_status(uuid, text);

-- Step 2: Create the new, refactored update_user_assignment_status function.
CREATE OR REPLACE FUNCTION public.update_user_assignment_status(
  p_target_user_id UUID,
  p_tenant_id UUID,
  p_new_status TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_caller_role TEXT := (auth.jwt() -> 'app_metadata' ->> 'role');
    v_caller_tenant_id UUID := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
    v_current_metadata JSONB;
    v_new_metadata JSONB;
BEGIN
    -- Step 2a: Authorization Check
    IF v_caller_role NOT IN ('super_admin', 'tenant_super_admin', 'tenant_admin') THEN
        RAISE EXCEPTION 'Permission denied: You do not have rights to update user status.';
    END IF;

    IF v_caller_role != 'super_admin' AND v_caller_tenant_id != p_tenant_id THEN
        RAISE EXCEPTION 'Permission denied: You can only update users within your own tenant.';
    END IF;

    -- Step 2b: Get the current metadata of the target user
    SELECT raw_app_meta_data INTO v_current_metadata FROM auth.users WHERE id = p_target_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target user not found.';
    END IF;

    -- Step 2c: Construct the new metadata object by updating the status
    v_new_metadata := v_current_metadata || jsonb_build_object('assignment_status', p_new_status);

    -- Step 2d: Update the user's app_metadata
    UPDATE auth.users
    SET raw_app_meta_data = v_new_metadata
    WHERE id = p_target_user_id;

    -- Step 2e: Return success
    RETURN jsonb_build_object('success', true, 'message', 'User assignment status updated successfully.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- COMMENT: Refactors the update_user_assignment_status RPC to be compatible with the native Supabase Auth system, modifying the assignment_status within the user's app_metadata.
