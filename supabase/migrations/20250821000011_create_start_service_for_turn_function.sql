CREATE OR REPLACE FUNCTION start_service_for_turn(p_turn_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE turns
  SET
    status = 'in_service'
  WHERE id = p_turn_id;
END;
$$;