-- This migration enhances the update_user_active_status function
-- to also invalidate active sessions when a user is deactivated.

CREATE OR REPLACE FUNCTION public.update_user_active_status(
  target_user_id uuid,
  p_is_active boolean,
  p_user_role TEXT
)
RETURNS JSON AS $$
BEGIN
  -- Security check
  IF p_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied. Super admin role required.';
  END IF;

  -- Update the user's status in the public.users table
  UPDATE public.users
  SET is_active = p_is_active
  WHERE id = target_user_id;

  -- If the user is being deactivated, also invalidate their active sessions
  IF p_is_active = false THEN
    UPDATE public.user_sessions
    SET is_active = false
    WHERE user_id = target_user_id AND is_active = true;
  END IF;

  -- Return a success confirmation
  RETURN json_build_object('success', TRUE, 'message', 'User status updated successfully.');
END;
$$ LANGUAGE plpgsql;
