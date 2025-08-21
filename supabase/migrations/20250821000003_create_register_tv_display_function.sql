CREATE OR REPLACE FUNCTION register_tv_display(p_registration_code text)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_tv_display_id uuid;
BEGIN
  INSERT INTO tv_displays (registration_code)
  VALUES (p_registration_code)
  RETURNING id INTO v_tv_display_id;

  RETURN v_tv_display_id;
END;
$$;