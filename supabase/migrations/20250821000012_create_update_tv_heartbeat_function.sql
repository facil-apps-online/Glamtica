CREATE OR REPLACE FUNCTION update_tv_heartbeat(p_tv_display_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tv_displays
  SET
    last_heartbeat = now()
  WHERE id = p_tv_display_id;
END;
$$;