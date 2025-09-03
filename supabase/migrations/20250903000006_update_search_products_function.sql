-- Primero, eliminamos la función existente para poder cambiar su firma de retorno.
DROP FUNCTION IF EXISTS public.search_products(uuid, text, boolean, text, uuid);

-- Ahora, creamos la función con la nueva estructura de retorno.
CREATE OR REPLACE FUNCTION public.search_products(
    p_tenant_id uuid,
    p_search_term text DEFAULT NULL,
    p_show_inactive boolean DEFAULT false,
    p_category_name text DEFAULT NULL,
    p_brand_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    is_active boolean,
    category text,
    created_at timestamptz,
    updated_at timestamptz,
    cost_price numeric,
    last_purchase_cost numeric,
    average_cost numeric,
    brand_id uuid,
    barcode text,
    sku text,
    tenant_id uuid,
    name_i18n jsonb,
    description_i18n jsonb,
    -- Nuevos campos añadidos
    unit_of_measure_id uuid,
    package_content_quantity numeric,
    allow_decimal_sale boolean
)
LANGUAGE plpgsql
AS $$
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
            p.description_i18n,
            p.unit_of_measure_id,      -- Campo añadido
            p.package_content_quantity, -- Campo añadido
            p.allow_decimal_sale       -- Campo añadido
        FROM
            products p
        WHERE
            p.tenant_id = $1';

    IF NOT p_show_inactive THEN
        final_query := final_query || '
            AND p.is_active = TRUE';
    END IF;

    IF p_category_name IS NOT NULL AND p_category_name <> '' THEN
        final_query := final_query || format('
            AND p.category = %L', p_category_name);
    END IF;

    IF p_brand_id IS NOT NULL THEN
        final_query := final_query || format('
            AND p.brand_id = %L', p_brand_id);
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
$$;