-- This migration creates the function to update a user's active status.

-- Drop old versions if they exist, for a clean slate.
DROP FUNCTION IF EXISTS public.update_user_active_status(uuid, boolean, text);

-- Create the final, correct version of the function
CREATE OR REPLACE FUNCTION public.update_user_active_status(
  target_user_id uuid,
  p_is_active boolean,
  p_user_role TEXT
)
RETURNS JSON AS $$
BEGIN
  -- Security check: only super_admin can perform this action
  IF p_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied. Super admin role required.';
  END IF;

  -- Update the is_active flag in the public.users table
  UPDATE public.users
  SET is_active = p_is_active
  WHERE id = target_user_id;

  -- Return a success confirmation
  RETURN json_build_object('success', TRUE, 'message', 'User status updated successfully.');
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_user_active_status(uuid, boolean, text) TO public;
