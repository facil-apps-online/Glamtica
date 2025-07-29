-- Elimina la función anterior si existe
DROP FUNCTION IF EXISTS execute_sql(TEXT);

-- Crea la nueva versión mejorada de la función
CREATE OR REPLACE FUNCTION execute_sql(sql TEXT)
RETURNS JSONB -- Devuelve un único objeto JSONB, que será un array
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Ejecuta la consulta y agrega todos los resultados en un único array JSON
    EXECUTE format('SELECT jsonb_agg(t) FROM (%s) t', sql) INTO result;
    -- Si la consulta no devuelve filas, jsonb_agg devuelve NULL. Lo convertimos a un array vacío.
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;
