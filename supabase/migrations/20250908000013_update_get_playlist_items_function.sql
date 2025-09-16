DROP FUNCTION IF EXISTS get_playlist_items(uuid);

CREATE FUNCTION get_playlist_items(p_playlist_id uuid)
RETURNS TABLE (
  id uuid,
  playlist_id uuid,
  media_url text,
  media_type text,
  item_order integer,
  created_at timestamptz,
  video_title text,
  duration_seconds integer
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pi.id,
    pi.playlist_id,
    pi.media_url,
    pi.media_type,
    pi.item_order,
    pi.created_at,
    pi.video_title,
    pi.duration_seconds
  FROM public.playlist_items pi
  WHERE pi.playlist_id = p_playlist_id
  ORDER BY pi.item_order;
END;
$$;