-- 1. Add timezone column to branches table
ALTER TABLE public.branches
ADD COLUMN IF NOT EXISTS timezone TEXT;

-- 2. Create or replace the create_branch function
CREATE OR REPLACE FUNCTION create_branch(
    p_tenant_id UUID,
    p_name TEXT,
    p_address TEXT DEFAULT NULL,
    p_contact_phone TEXT DEFAULT NULL,
    p_whatsapp_phone TEXT DEFAULT NULL,
    p_commercial_email TEXT DEFAULT NULL,
    p_website TEXT DEFAULT NULL,
    p_physical_address_line1 TEXT DEFAULT NULL,
    p_physical_address_line2 TEXT DEFAULT NULL,
    p_physical_city TEXT DEFAULT NULL,
    p_physical_state TEXT DEFAULT NULL,
    p_physical_postal_code TEXT DEFAULT NULL,
    p_latitude NUMERIC DEFAULT NULL,
    p_longitude NUMERIC DEFAULT NULL,
    p_timezone TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    tenant_id UUID,
    name TEXT,
    address TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    language_code TEXT,
    currency_id UUID,
    timezone TEXT,
    is_main_branch BOOLEAN,
    status branch_status,
    activated_at TIMESTAMPTZ,
    contact_phone TEXT,
    whatsapp_phone TEXT,
    commercial_email TEXT,
    website TEXT,
    physical_address_line1 TEXT,
    physical_address_line2 TEXT,
    physical_city TEXT,
    physical_state TEXT,
    physical_postal_code TEXT,
    latitude NUMERIC,
    longitude NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO public.branches (
        tenant_id,
        name,
        address,
        contact_phone,
        whatsapp_phone,
        commercial_email,
        website,
        physical_address_line1,
        physical_address_line2,
        physical_city,
        physical_state,
        physical_postal_code,
        latitude,
        longitude,
        timezone
    )
    VALUES (
        p_tenant_id,
        p_name,
        p_address,
        p_contact_phone,
        p_whatsapp_phone,
        p_commercial_email,
        p_website,
        p_physical_address_line1,
        p_physical_address_line2,
        p_physical_city,
        p_physical_state,
        p_physical_postal_code,
        p_latitude,
        p_longitude,
        p_timezone
    )
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create or replace the update_branch function
CREATE OR REPLACE FUNCTION update_branch(
    p_branch_id UUID,
    p_name TEXT,
    p_address TEXT DEFAULT NULL,
    p_contact_phone TEXT DEFAULT NULL,
    p_whatsapp_phone TEXT DEFAULT NULL,
    p_commercial_email TEXT DEFAULT NULL,
    p_website TEXT DEFAULT NULL,
    p_physical_address_line1 TEXT DEFAULT NULL,
    p_physical_address_line2 TEXT DEFAULT NULL,
    p_physical_city TEXT DEFAULT NULL,
    p_physical_state TEXT DEFAULT NULL,
    p_physical_postal_code TEXT DEFAULT NULL,
    p_latitude NUMERIC DEFAULT NULL,
    p_longitude NUMERIC DEFAULT NULL,
    p_timezone TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    tenant_id UUID,
    name TEXT,
    address TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    language_code TEXT,
    currency_id UUID,
    timezone TEXT,
    is_main_branch BOOLEAN,
    status branch_status,
    activated_at TIMESTAMPTZ,
    contact_phone TEXT,
    whatsapp_phone TEXT,
    commercial_email TEXT,
    website TEXT,
    physical_address_line1 TEXT,
    physical_address_line2 TEXT,
    physical_city TEXT,
    physical_state TEXT,
    physical_postal_code TEXT,
    latitude NUMERIC,
    longitude NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    UPDATE public.branches
    SET
        name = p_name,
        address = p_address,
        contact_phone = p_contact_phone,
        whatsapp_phone = p_whatsapp_phone,
        commercial_email = p_commercial_email,
        website = p_website,
        physical_address_line1 = p_physical_address_line1,
        physical_address_line2 = p_physical_address_line2,
        physical_city = p_physical_city,
        physical_state = p_physical_state,
        physical_postal_code = p_physical_postal_code,
        latitude = p_latitude,
        longitude = p_longitude,
        timezone = p_timezone,
        updated_at = NOW()
    WHERE
        public.branches.id = p_branch_id
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
