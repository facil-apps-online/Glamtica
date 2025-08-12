-- Eliminar la función existente
DROP FUNCTION IF EXISTS search_services(UUID, TEXT, BOOLEAN, UUID);

-- Crear la función
CREATE OR REPLACE FUNCTION search_services(
    p_tenant_id UUID,
    p_search_term TEXT,
    p_show_inactive BOOLEAN,
    p_category_id UUID
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    duration_minutes INTEGER,
    price NUMERIC,
    is_active BOOLEAN,
    category_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    tenant_id UUID,
    name_i18n JSONB,
    description_i18n JSONB
) AS $$ 
DECLARE
    search_words TEXT[];
    word TEXT;
    query_conditions TEXT[] := ARRAY[]::TEXT[];
    final_query TEXT;
BEGIN
    -- Split the search term into words
    IF p_search_term IS NOT NULL AND p_search_term <> '' THEN
        search_words := string_to_array(lower(p_search_term), ' ');
    ELSE
        search_words := ARRAY[]::TEXT[];
    END IF;

    -- Build the query conditions for each word
    FOREACH word IN ARRAY search_words
    LOOP
        IF word <> '' THEN
            query_conditions := array_append(
                query_conditions,
                format(
                    '(s.name ILIKE %1$L OR s.description ILIKE %1$L)',
                    '%' || word || '%'
                )
            );
        END IF;
    END LOOP;

    -- Construct the final query
    final_query := '
        SELECT
            s.id,
            s.name,
            s.description,
            s.duration_minutes,
            s.price,
            s.is_active,
            s.category_id,
            s.created_at,
            s.updated_at,
            s.tenant_id,
            s.name_i18n,
            s.description_i18n
        FROM
            services s
        WHERE
            s.tenant_id = $1';

    IF NOT p_show_inactive THEN
        final_query := final_query || '
            AND s.is_active = TRUE';
    END IF;

    IF p_category_id IS NOT NULL THEN
        final_query := final_query || format('
            AND s.category_id = %L', p_category_id);
    END IF;

    IF array_length(query_conditions, 1) > 0 THEN
        final_query := final_query || '
            AND (' || array_to_string(query_conditions, ' AND ') || ')';
    END IF;

    final_query := final_query || '
        ORDER BY s.name;';

    -- Execute the query
    RETURN QUERY EXECUTE final_query USING p_tenant_id;
END;
$$ LANGUAGE plpgsql;
