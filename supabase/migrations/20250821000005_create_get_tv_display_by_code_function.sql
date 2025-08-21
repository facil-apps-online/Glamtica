CREATE OR REPLACE FUNCTION get_tv_display_by_code(p_registration_code text)
RETURNS TABLE (
  id uuid,
  branch_id uuid,
  registration_code text,
  is_registered boolean,
  registered_at timestamptz,
  last_heartbeat timestamptz,
  media_playlist_id uuid,
  tenant_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM tv_displays
  WHERE tv_displays.registration_code = p_registration_code;
END;
$$;