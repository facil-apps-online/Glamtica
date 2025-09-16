
CREATE OR REPLACE FUNCTION create_unregistered_tv()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_tv_display RECORD;
  generated_code TEXT;
BEGIN
  -- Generar un código único de 6 caracteres alfanuméricos
  LOOP
    generated_code := upper(substr(md5(random()::text), 0, 7));
    IF NOT EXISTS (SELECT 1 FROM public.tv_displays WHERE registration_code = generated_code) THEN
      EXIT;
    END IF;
  END LOOP;

  -- Insertar el nuevo registro de TV
  INSERT INTO public.tv_displays (registration_code, is_registered)
  VALUES (generated_code, false)
  RETURNING * INTO new_tv_display;

  -- Devolver el registro completo como JSON
  RETURN row_to_json(new_tv_display);
END;
$$;