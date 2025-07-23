-- Migración para actualizar la RPC get_tenants_with_metrics y usar la nueva lógica de estado de suscripción.

-- Primero, eliminamos la función existente para poder modificarla.
DROP FUNCTION IF EXISTS public.get_tenants_with_metrics(TEXT);

-- Luego, la volvemos a crear con la lógica de estado actualizada.
CREATE OR REPLACE FUNCTION get_tenants_with_metrics(search_term_param TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name TEXT,
    subscription_status TEXT, -- Este campo ahora vendrá de la nueva función
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
    country_iso_code TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.name,
        (SELECT status FROM public.get_tenant_subscription_status(t.id)), -- Llama a la nueva función
        t.created_at,
        t.updated_at,
        t.default_language_code,
        t.default_currency_id,
        t.default_timezone,
        t.contact_person,
        t.contact_email,
        t.contact_phone,
        t.country_id,
        t.is_active,
        t.logo_url,
        t.notes,
        t.legal_name,
        t.tax_id,
        t.billing_address,
        t.website,
        t.whatsapp_phone,
        t.einvoicing_email,
        t.physical_address_line1,
        t.physical_address_line2,
        t.physical_city,
        t.physical_state,
        t.physical_postal_code,
        t.latitude::text,
        t.longitude::text,
        t.commercial_email,
        c.name as country_name,
        c.iso_code as country_iso_code
    FROM
        public.tenants t
    LEFT JOIN
        public.countries c ON t.country_id = c.id
    WHERE
        search_term_param IS NULL OR
        t.name ILIKE '%' || search_term_param || '%' OR
        t.legal_name ILIKE '%' || search_term_param || '%' OR
        t.commercial_email ILIKE '%' || search_term_param || '%' OR
        t.tax_id ILIKE '%' || search_term_param || '%'
    ORDER BY
        t.name ASC;
END;
$$;
