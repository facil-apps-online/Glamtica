-- This migration creates the final, correct version of the function.
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

  -- Update the public.users table
  UPDATE public.users
  SET is_active = p_is_active
  WHERE id = target_user_id;

  -- Return a success confirmation
  RETURN json_build_object('success', TRUE, 'message', 'User status updated successfully.');
END;
$$ LANGUAGE plpgsql;
