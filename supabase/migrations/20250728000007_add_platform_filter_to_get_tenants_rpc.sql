CREATE OR REPLACE FUNCTION get_tenants(
    p_search_term TEXT DEFAULT NULL,
    p_platform_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    name text,
    subscription_status text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    platform json,
    default_language_code text,
    default_currency_id uuid,
    default_timezone text,
    contact_person text,
    contact_email text,
    contact_phone text,
    country_id uuid,
    is_active boolean,
    logo_url text,
    notes text,
    legal_name text,
    tax_id text,
    billing_address text,
    website text,
    whatsapp_phone text,
    commercial_email text,
    einvoicing_email text,
    physical_address_line1 text,
    physical_address_line2 text,
    physical_city text,
    physical_state text,
    physical_postal_code text,
    latitude numeric,
    longitude numeric,
    integrations_mode text,
    is_system_owner boolean,
    platform_id uuid,
    countries json
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.name,
        t.subscription_status,
        t.created_at,
        t.updated_at,
        json_build_object('id', p.id, 'name', p.name) as platform,
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
        t.commercial_email,
        t.einvoicing_email,
        t.physical_address_line1,
        t.physical_address_line2,
        t.physical_city,
        t.physical_state,
        t.physical_postal_code,
        t.latitude,
        t.longitude,
        t.integrations_mode,
        t.is_system_owner,
        t.platform_id,
        json_build_object('name', c.name, 'iso_code', c.iso_code) as countries
    FROM
        public.tenants t
    LEFT JOIN
        public.platforms p ON t.platform_id = p.id
    LEFT JOIN
        public.countries c ON t.country_id = c.id
    WHERE
        (p_search_term IS NULL OR t.name ILIKE '%' || p_search_term || '%')
        AND (p_platform_id IS NULL OR t.platform_id = p_platform_id);
END;
$$;
