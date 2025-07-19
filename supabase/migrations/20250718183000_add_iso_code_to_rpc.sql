-- Migración para añadir el código ISO del país a la RPC get_tenants_with_metrics

-- Primero, eliminamos la función existente para poder cambiar su tipo de retorno.
DROP FUNCTION IF EXISTS public.get_tenants_with_metrics(TEXT);

-- Luego, la volvemos a crear con la nueva columna 'country_iso_code'.
CREATE FUNCTION get_tenants_with_metrics(search_term_param TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name TEXT,
    subscription_status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    default_language_code TEXT,
    default_currency_id UUID,
    default_timezone TEXT,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    country_id UUID,
    is_active BOOLEAN,
    logo_url TEXT,
    notes TEXT,
    legal_name TEXT,
    tax_id TEXT,
    billing_address TEXT,
    website TEXT,
    whatsapp_phone TEXT,
    einvoicing_email TEXT,
    physical_address_line1 TEXT,
    physical_address_line2 TEXT,
    physical_city TEXT,
    physical_state TEXT,
    physical_postal_code TEXT,
    latitude TEXT,
    longitude TEXT,
    commercial_email TEXT,
    country_name TEXT,
    country_iso_code TEXT -- Campo añadido
)
LANGUAGE plpgsql
AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    response_time_ms INTEGER;
BEGIN
    start_time := clock_timestamp();

    CREATE TEMP TABLE temp_tenants AS
    SELECT
        t.id, t.name, t.subscription_status, t.created_at, t.updated_at,
        t.default_language_code, t.default_currency_id, t.default_timezone,
        t.contact_person, t.contact_email, t.contact_phone, t.country_id,
        t.is_active, t.logo_url, t.notes, t.legal_name, t.tax_id,
        t.billing_address, t.website, t.whatsapp_phone, t.einvoicing_email,
        t.physical_address_line1, t.physical_address_line2, t.physical_city,
        t.physical_state, t.physical_postal_code, t.latitude::text, t.longitude::text,
        t.commercial_email,
        c.name as country_name,
        c.iso_code as country_iso_code -- Campo añadido
    FROM
        public.tenants t
    LEFT JOIN
        public.countries c ON t.country_id = c.id
    WHERE
        search_term_param IS NULL OR
        t.name ILIKE '%' || search_term_param || '%' OR
        t.legal_name ILIKE '%' || search_term_param || '%' OR
        t.commercial_email ILIKE '%' || search_term_param || '%' OR
        t.tax_id ILIKE '%' || search_term_param || '%';

    end_time := clock_timestamp();
    response_time_ms := (EXTRACT(EPOCH FROM (end_time - start_time)) * 1000)::INTEGER;

    INSERT INTO public.api_request_metrics (path, method, status_code, response_time_ms)
    VALUES ('rpc/get_tenants_with_metrics', 'POST', 200, response_time_ms);

    RETURN QUERY SELECT * FROM temp_tenants ORDER BY name ASC;

    DROP TABLE temp_tenants;
END;
$$;
