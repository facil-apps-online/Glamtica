CREATE OR REPLACE FUNCTION search_products(
    p_tenant_id UUID,
    p_search_term TEXT,
    p_show_inactive BOOLEAN
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    is_active BOOLEAN,
    category TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    cost_price NUMERIC,
    last_purchase_cost NUMERIC,
    average_cost NUMERIC,
    brand_id UUID,
    barcode TEXT,
    sku TEXT,
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
                    '(p.name ILIKE %1$L OR p.description ILIKE %1$L OR p.sku ILIKE %1$L OR p.barcode ILIKE %1$L)',
                    '%' || word || '%'
                )
            );
        END IF;
    END LOOP;

    -- Construct the final query
    final_query := '
        SELECT
            p.id,
            p.name,
            p.description,
            p.is_active,
            p.category,
            p.created_at,
            p.updated_at,
            p.cost_price,
            p.last_purchase_cost,
            p.average_cost,
            p.brand_id,
            p.barcode,
            p.sku,
            p.tenant_id,
            p.name_i18n,
            p.description_i18n
        FROM
            products p
        WHERE
            p.tenant_id = $1';

    IF NOT p_show_inactive THEN
        final_query := final_query || '
            AND p.is_active = TRUE';
    END IF;

    IF array_length(query_conditions, 1) > 0 THEN
        final_query := final_query || '
            AND (' || array_to_string(query_conditions, ' AND ') || ')';
    END IF;

    final_query := final_query || '
        ORDER BY p.name;';

    -- Execute the query
    RETURN QUERY EXECUTE final_query USING p_tenant_id;
END;
$$ LANGUAGE plpgsql;