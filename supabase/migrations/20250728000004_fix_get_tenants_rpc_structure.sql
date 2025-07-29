-- Migration: 20250728000004_fix_get_tenants_rpc_structure.sql
-- Description: Corrects the result type of the 'get_tenants' function to match the query structure.
-- Adds the missing fields to the RETURNS TABLE definition.

-- Drop the incorrect version of the function first
DROP FUNCTION IF EXISTS public.get_tenants(TEXT);

-- Recreate the function with the correct structure
CREATE OR REPLACE FUNCTION get_tenants(p_search_term TEXT DEFAULT NULL)
RETURNS TABLE (
    id uuid,
    name text,
    subscription_status public.tenant_subscription_status,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    platform json,
    default_language_code text,
    default_currency_id uuid,
    default_timezone text,
    contact_person text, -- Was missing
    contact_phone text,
    country_id uuid,
    is_active boolean,
    logo_url text, -- Was missing
    notes text, -- Was missing
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

-- COMMENT: This fixes the function signature to align with the columns being returned by the SELECT query, resolving the "structure does not match" error.
