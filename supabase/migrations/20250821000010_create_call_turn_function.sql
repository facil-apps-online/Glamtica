CREATE OR REPLACE FUNCTION call_turn(p_turn_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE turns
  SET
    status = 'called',
    called_at = now()
  WHERE id = p_turn_id;
END;
$$;