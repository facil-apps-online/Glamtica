-- Migration: 20250725000015_create_sync_user_assignments_rpc.sql
-- Description: Creates the master RPC for managing user permissions in the new architecture.
-- This function synchronizes the 'assignments' array in a user's app_metadata.

-- For now, this function is restricted to super_admins for security.
-- More granular RPCs can be created for lower-level admins later.

CREATE OR REPLACE FUNCTION public.sync_user_assignments(
    p_target_user_id UUID,
    p_assignments JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    -- For simplicity and security, we'll assume the client sets a primary 'role' claim
    -- in the JWT based on the context the user is currently operating in.
    -- The definitive check is for the 'super_admin' role within the assignments array.
    v_caller_is_super_admin BOOLEAN;
BEGIN
    -- Step 1: Authorization Check
    -- Verify that the calling user has a 'super_admin' role in their assignments.
    SELECT EXISTS (
        SELECT 1
        FROM jsonb_array_elements((auth.jwt() -> 'app_metadata' -> 'assignments')::jsonb) as elem
        WHERE elem ->> 'role' = 'super_admin'
    ) INTO v_caller_is_super_admin;

    IF NOT v_caller_is_super_admin THEN
        RAISE EXCEPTION 'Permission denied: You must be a super_admin to manage user assignments.';
    END IF;

    -- Step 2: Input Validation
    -- Ensure the provided assignments object is a valid JSON array.
    IF NOT jsonb_typeof(p_assignments) = 'array' THEN
        RAISE EXCEPTION 'Invalid input: assignments must be a JSON array.';
    END IF;

    -- Step 3: Update User Metadata
    -- This completely replaces the 'assignments' array in the target user's app_metadata.
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
        raw_app_meta_data,
        '{assignments}',
        p_assignments,
        true -- Create the 'assignments' key if it doesn't exist
    )
    WHERE id = p_target_user_id;

    RETURN jsonb_build_object('success', true, 'message', 'User assignments synchronized successfully.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.sync_user_assignments(UUID, JSONB) 
IS 'Allows a super_admin to completely synchronize the assignments array for a target user.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.sync_user_assignments(UUID, JSONB) TO authenticated;
