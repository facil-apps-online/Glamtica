-- Migration: 20250728000002_create_get_tenants_rpc.sql
-- Description: Creates a new RPC function 'get_tenants' to fetch tenants with their associated platform data.
-- This replaces the direct query logic in the edge function to align with project architecture.

CREATE OR REPLACE FUNCTION get_tenants(p_search_term TEXT DEFAULT NULL)
RETURNS TABLE (
    id uuid,
    name text,
    subscription_status public.tenant_subscription_status,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    platform json, -- Returning the platform as a JSON object
    default_language_code text,
    default_currency_id uuid,
    default_timezone text,
    contact_person text,
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
    latitude double precision,
    longitude double precision,
    countries json -- Existing structure for UI
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
        json_build_object('name', c.name, 'iso_code', c.iso_code) as countries
    FROM
        public.tenants t
    LEFT JOIN
        public.platforms p ON t.platform_id = p.id
    LEFT JOIN
        public.countries c ON t.country_id = c.id
    WHERE
        p_search_term IS NULL OR t.name ILIKE '%' || p_search_term || '%'
    ORDER BY
        t.name ASC;
END;
$$;

-- COMMENT: This function encapsulates the logic for fetching tenants, making it reusable and consistent.
