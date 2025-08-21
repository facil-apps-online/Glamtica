CREATE OR REPLACE FUNCTION get_playlist_items(p_playlist_id uuid)
RETURNS TABLE (
  id uuid,
  playlist_id uuid,
  media_url text,
  media_type text,
  item_order integer,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM playlist_items
  WHERE playlist_items.playlist_id = p_playlist_id
  ORDER BY playlist_items.item_order;
END;
$$;