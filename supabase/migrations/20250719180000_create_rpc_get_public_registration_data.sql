CREATE OR REPLACE FUNCTION get_public_registration_data()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'countries', (
      SELECT json_agg(
        json_build_object(
          'id', c.id,
          'name', c.name,
          'iso_code', c.iso_code,
          'default_localization_id', c.default_localization_id,
          'default_currency_id', c.default_currency_id,
          'timezone', c.timezone
        )
      )
      FROM countries c
      WHERE c.is_active = true
    ),
    'languages', ( -- CORREGIDO: de 'localizations' a 'languages'
      SELECT json_agg(
        json_build_object(
          'id', l.id,
          'name', l.name,
          'iso_code', l.iso_code
        )
      )
      FROM languages l -- CORREGIDO: de 'localizations' a 'languages'
      WHERE l.is_active = true
    ),
    'currencies', (
      SELECT json_agg(
        json_build_object(
          'id', curr.id,
          'name', curr.name,
          'symbol', curr.symbol
        )
      )
      FROM currencies curr
      WHERE curr.is_active = true
    ),
    'timezones', (
      SELECT json_agg(
        json_build_object(
          'name', t.name
        )
      )
      FROM timezones t
      WHERE t.is_active = true
    )
  );
$$;