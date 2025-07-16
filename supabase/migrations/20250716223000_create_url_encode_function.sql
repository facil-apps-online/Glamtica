-- supabase/migrations/20250716223000_create_url_encode_function.sql

-- Creamos la función de utilidad url_encode si no existe.
-- Esta función es necesaria para construir las URLs de autorización de Google de forma segura.
CREATE OR REPLACE FUNCTION url_encode(data text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
    SELECT string_agg(
        CASE
            -- Caracteres no reservados que no necesitan codificación
            WHEN c ~ '^[a-zA-Z0-9._~-]$' THEN c
            -- Todos los demás caracteres se codifican en formato %XX
            ELSE '%' || upper(to_hex(ascii(c)))
        END, ''
    )
    FROM unnest(string_to_array(data, NULL)) AS c;
$$;
